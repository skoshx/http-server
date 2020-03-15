import { serve, Server, ServerRequest } from 'https://deno.land/std@v0.35.0/http/server.ts';
import { resolve, normalize, join, relative } from 'https://deno.land/std@v0.35.0/path/posix.ts';
import { open } from 'https://deno.land/x/open/index.ts';
// Hooks
import { corsHook, authHook, logIpHook, logRequestHook } from './hooks.ts';
// Encoder
const Encoder = new TextEncoder()

export interface IResponse {
  status?: number;
  headers?: Headers;
  body?: Uint8Array | Deno.Reader | string;
  trailers?: () => Promise<Headers> | Headers;
}

export class Response {
  public status: number;
  public headers: Headers;
  public body: Uint8Array | Deno.Reader | string | undefined;
  public trailers: (() => Promise<Headers> | Headers) | undefined;
  constructor(status?: number, headers?: Headers, body?: Uint8Array | Deno.Reader | string, trailers?: () => Promise<Headers> | Headers) {
    this.status = status || 200;
    this.headers = headers || new Headers();
    this.body = body;
    this.trailers = trailers;
  }

  public get(): IResponse {
    return {
      status: this.status,
      headers: this.headers,
      body: this.body,
      trailers: this.trailers
    }
  }
}

export interface HttpServerOptions {
  root: string;
  port: number;
  // headers: HttpServerHeader[];
  headers: string[][];
  hostname: string;
  cors: boolean;
  cache: number | string; // cache in seconds, or no cache
  dotFiles: boolean; // Show dotfiles
  dir: boolean; // Show directories
  autoIndex: boolean; // Display autoIndex
  open: boolean; // Open browser window after starting the server
  extension: string; // Default file extension, if none supplied
  contentType: string;
  logIp: boolean;
  ssl: boolean;
  cert: string; // Path to certificate file
  key: string; // Path to key file
  auth: boolean; // Basic HTTP Header Authentication
  username: string; // Username for authentication
  password: string; // Password for authentication
  dark: boolean;
}

export type RequestHandler = () => void | Promise<void>;

const HttpServerDefaults: HttpServerOptions = {
  root: '.',
  port: 8080,
  headers: [],
  hostname: '0.0.0.0',
  cors: false,
  cache: 3600,
  dotFiles: true,
  dir: true,
  autoIndex: true,
  open: true,
  extension: 'html',
  contentType: 'text/html',
  logIp: false,
  ssl: false,
  cert: '',
  key: '',
  auth: false,
  username: '',
  password: '',
  dark: false
};

export type HookFunction = (request: ServerRequest, response: Response, options: HttpServerOptions) => Promise<Response>;

export class HttpServer {
  public readonly options: HttpServerOptions;
  
  private hooks: HookFunction[] = [];

  public server!: Server;

  constructor(path?: string, options?: HttpServerOptions) {
    this.options = {...HttpServerDefaults, ...options};
    this.options.root = resolve(path ?? '');

    // Logging visits
    this.use(logRequestHook);

    if (this.options.cors) {
      this.use(corsHook); // Add CORS hook
    }
    if (this.options.logIp) {
      this.use(logIpHook);
    }
    if (this.options.auth) {
      if (!this.options.username || this.options.username === '') {
        throw Error('You cannot have authentication enabled with no username! Define it using the --username flag.');
      }
      if (!this.options.password || this.options.password === '') {
        throw Error('You cannot have authentication enabled with no password! Define it using the --password flag.');
      }
      this.use(authHook.bind(this)); // Add authentication hook
    }
    // Requests go through a handler
    this.startServer(this.options);
    if (this.options.open) {
      const url = `${this.options.ssl ? 'https://' : 'http://'}${this.options.hostname}:${this.options.port}`;
      open(url); // Open in default browser
    }
  }

  /**
   * Add a hook to the server. Hooks receive all requests and can process them.
   * @param fn The function to handle the request
   */
  public use(fn: HookFunction) {
    this.hooks.push(fn);
  }

  public stopServer(): void {
    if (this.server) {
      this.server.close();
    }
  }

  private async startServer(options: HttpServerOptions): Promise<boolean> {
    // const s = serve({ port: options.port, hostname: options.hostname });
    this.server = serve({ port: options.port, hostname: options.hostname });
    for await (const req of this.server) {
      this.handleRequest(req)
    }
    return true;
  }

  private async isFile(fileName: string): Promise<boolean> {
    try {
      const info = await Deno.stat(fileName)
      return info.isFile()
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return false; // File or directory exists
      } else { throw err; }
    }
  }

  private getHeaders(headers: Headers): Headers {
    headers.set("content-type", `${this.options.contentType}; charset=utf-8`);
    this.options.headers.forEach(header => {
      headers.set(header[0], header[1]);
    });
    return headers
  }

  private async handleRequest(request: ServerRequest) {
    const urlPath = decodeURIComponent(normalize(request.url));
    const filePath = join(this.options.root, urlPath);

    let response = new Response();
    // Pass request trough hooks
    this.hooks.forEach(async hook => {
      response = await hook(request, response, this.options);
    });

    if (await this.isFile(filePath)) {
      this.serveFile(filePath, request, response);
    } else {
      this.serveDir(filePath, request, response);
    }
  }
  
  private async serveFile(filePath: string, request: ServerRequest, response: Response) {
    // const [file, fileInfo] = await Promise.all([Deno.open(filePath), Deno.stat(filePath)]);
    const file = await Deno.open(filePath);
    // TODO: Rewrite / Make cleaner
    response.status = 200
    response.body = file
    response.headers = this.getHeaders(response.headers);
    request.respond(response.get());
  }

  /**
   * Returns the Deno readdir function. Adds backward compatibility for Deno.readDir
   */
  private readDirWrapper(filePath: string) {
    if (typeof Deno.readDir === 'function') {
      return Deno.readDir(filePath)
    } else {
      // @ts-ignore
      return Deno.readdir(filePath);
    }

  }

  private async serveDir(filePath: string, request: ServerRequest, response: Response) {
    try {
      const dirUrl = `/${relative(this.options.root, filePath)}`;
      // const files: Deno.FileInfo[] = await Deno.readDir(filePath);
      const files: Deno.FileInfo[] = await this.readDirWrapper(filePath);
      const fileInfo = await Deno.stat(filePath);
      const html = this.generateHTMLForDirectory(dirUrl, files);
      response.headers = this.getHeaders(response.headers);
      response.status = 200;
      response.body = Encoder.encode(html);
      request.respond(response.get());
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) {
        throw e;
      }
    }
  }

  private formatBytes(bytes: number, decimals: number = 2) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  private modeToString(isDir: boolean, maybeMode: number | null): string {
    const modeMap = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
  
    if (maybeMode === null) {
      return '(unknown mode)';
    }
    const mode = maybeMode.toString(8);
    if (mode.length < 3) {
      return '(unknown mode)';
    }
    let output = '';
    mode
      .split('')
      .reverse()
      .slice(0, 3)
      .forEach((v): void => {
        output = modeMap[+v] + output;
      });
    output = `(${isDir ? 'd' : '-'}${output})`;
    return output;
  }


  /**
   * Generates a HTML page for the 
   * @param files The files in the directory, returned by Deno.readDir
   */
  public generateHTMLForDirectory(dirUrl: string, files: Deno.FileInfo[]) {
    let filesHTML = '';
    for (let i = 0; i < files.length; i++) {
      const fileUrl = join(dirUrl, files[i].name ?? '');
      filesHTML += `
      <div class="file">
        <p>${this.modeToString(files[i].isDirectory(), files[i].mode)}</p>
        <p>${this.formatBytes(files[i].len)}</p>
        <a href="${fileUrl}">${files[i].name}</a>
      </div>`;
    }
    return `
    <!DOCTYPE html>
    <html lang="en"${this.options.dark ? ' dark' : ''}>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Index of ${dirUrl}</title>
      <style>
      :root {
        --primary-color: #fff;
        --secondary-color: #222;
      }
      html[dark] {
        --primary-color: #222;
        --secondary-color: #fff;
      }
      /* Skeleton styles */
      html {
        -webkit-text-size-adjust: 100%;
        box-sizing: border-box;
        font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;
        line-height: 1.5;
        font-size: 62.5%;
      }
      body {
        font-size: 1.5em;
        line-height: 1.6;
        font-weight: 400;
        background-color: var(--primary-color);
        color: var(--secondary-color);
      }
      a { color: dodgerblue; }
      /* Styling for file list */
      .file {
        display: flex;
        align-items: center;
      }
      .file > * {
        margin-right: 2rem;
      }
      </style>
    </head>
    <body>
      <h1>Index of ${dirUrl}</h1>
      ${filesHTML.toString()}
      <p>Deno v${Deno.version.deno} | <a href="https://github.com/SkoshRG/http-server">http-server</a> running @ ${this.options.hostname}:${this.options.port}</p>
    </body>
    </html>
    `;
  }
}