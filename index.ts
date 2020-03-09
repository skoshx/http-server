import { serve, Response, ServerRequest } from 'https://deno.land/std@v0.35.0/http/server.ts';
import { posix } from 'https://deno.land/std@v0.35.0/path/posix.ts';
import { existsSync } from 'https://deno.land/std@v0.35.0/fs/mod.ts';

export interface HttpServerHeader {
  headerName: string,
  headerValue: string
}

export interface HttpServerOptions {
  root: string;
  port: number;
  headers: HttpServerHeader[];
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
};

export type HookFunction = (request: ServerRequest) => Promise<boolean>;

export class HttpServer {
  public readonly options: HttpServerOptions;
  
  private hooks: HookFunction[];

  constructor(options?: HttpServerOptions) {
    this.options = {...HttpServerDefaults, ...options};

    if (this.options.cors) {
      const corsHeaders: HttpServerHeader[] = [
        { headerName: 'access-control-allow-origin', headerValue: '*' },
        { headerName: 'access-control-allow-headers', headerValue: 'Origin, X-Requested-With, Content-Type, Accept, Range' }
      ]
      this.options.headers.push(...corsHeaders)
    }
    if (this.options.auth) {
      // Add authentication hook
      this.hooks.push(this.authHook);
    }
    // Requests go through a handler
    this.startServer(this.options);
    if (this.options.open) {
      // Open in default web browser
    }
  }

  private async startServer(options: HttpServerOptions): Promise<boolean> {
    const s = serve({ port: options.port, hostname: options.hostname });
    for await (const req of s) {
      this.handleRequest(req)
    }
    return true;
  }

  private async fileExists(fileName: string): Promise<boolean> {
    try {
      const info = await Deno.stat(fileName)
      return info.isFile()
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return false; // File or directory exists
      } else { throw err; }
    }
  }

  private getHeaders(fileInfo: Deno.FileInfo): Headers {
    const headers = new Headers();
    headers.set("content-type", `${this.options.contentType}; charset=utf-8`);
    headers.set("content-length", fileInfo.len.toString());
    return headers
  }

  private corsHook(request: ServerRequest, next: Function) {
    console.log(`Request received!`)
    next()
  }

  // Basic HTTP Authentication hook
  private async authHook(request: ServerRequest): Promise<boolean> {
    const b64Auth = (request.headers.authorization || '').split(' ')[1] || '';
    const strAuth = atob(b64Auth);
    const splitIndex = strAuth.indexOf(':')
    const username = strAuth.substring(0, splitIndex)
    const password = strAuth.substring(splitIndex + 1)
    if (username && password && username === this.options.username && password === this.options.password) {
      // User is authenticated, allow requests through.
      return true;
    } else {
      // 401 Unauthorized
      const headers = new Headers();
      headers.set('WWW-Authenticate', 'Basic realm="401"');
      request.respond({
        status: 401,
        body: '401 Unauthorized. Authentication required.',
        headers
      });
      return false;
    }
  }

  private async handleRequest(request: ServerRequest) {
    const filePath = `${this.options.root}${request.url}`;
    // TODO: Pass request through all hooks
    // this.hooks.forEach()

    if (await this.fileExists(filePath)) {
      const [file, fileInfo] = await Promise.all([Deno.open(filePath), Deno.stat(filePath)]);
      const headers = this.getHeaders(fileInfo);
      request.respond({
        status: 200,
        body: file,
        headers
      });
    }
    try {
      // const dirUrl = `/${posix.relative(target, dirPath)}`;
      // const filePath = posix.join(dirPath, fileInfo.name ?? "");
      // const fileUrl = posix.join(dirUrl, fileInfo.name ?? "");

      const files: Deno.FileInfo[] = await Deno.readDir(filePath);
      const fileInfo = await Deno.stat(filePath);
      const html = this.generateHTMLForDirectory(files);
      const headers = this.getHeaders(fileInfo)
      const response = {
        status: 200,
        body: html,
        headers
      };
      request.respond(response)
    } catch (e) {}
  }

  private formatBytes(bytes: number, decimals: number = 2) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


  /**
   * Generates a HTML page for the 
   * @param files The files in the directory, returned by Deno.readDir
   */
  private generateHTMLForDirectory(files: Deno.FileInfo[]) {
    const filesHTML = files.map(file => {
      return `
      <div class="file">
        <div></div>
        <p>${file.mode}</p>
        <p>${this.formatBytes(file.len)}</p>
        <a href="${file.name}">${file.name}</a>
      </div>
      `
    });
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Index of ${this.options.root}/</title>
    </head>
    <body>
      <h1>Index of ${this.options.root}/</h1>
      ${filesHTML}
      <p>Deno v${Deno.version.deno} | <a href="https://todo.link.to.repo">http-server</a> running @ ${this.options.hostname}:${this.options.port}</p>
    </body>
    </html>
    `
  }
}