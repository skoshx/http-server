import { ServerRequest } from 'https://deno.land/std@v0.35.0/http/server.ts';
import { Response, HttpServer, HttpServerOptions } from './index.ts';
import { log } from './log.ts';

const Encoder = new TextEncoder();

export async function corsHook(req: ServerRequest, res: Response): Promise<Response> {
  res.headers.set('access-control-allow-origin', '*');
  res.headers.set('access-control-allow-headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  return res;
}

// Basic HTTP Authentication hook
export async function authHook(request: ServerRequest, res: Response, options: HttpServerOptions): Promise<Response> {
  const b64Auth = (request.headers.get('authorization') || '').split(' ')[1] || '';
  const strAuth = atob(b64Auth);
  const splitIndex = strAuth.indexOf(':')
  const username = strAuth.substring(0, splitIndex)
  const password = strAuth.substring(splitIndex + 1)
  if (username === options.username && password === options.password) {
    // User is authenticated, allow requests through.
    return res;
  } else {
    // 401 Unauthorized
    res.headers.set('WWW-Authenticate', 'Basic realm="401"');
    res.status = 401;
    res.body = '401 Unauthorized. Authentication required.';
    request.respond(res.get());
    /*request.respond({
      status: 401,
      body: '401 Unauthorized. Authentication required.',
    });*/
    return res;
  }
}

export async function logRequestHook(req: ServerRequest, res: Response) {
  const d = new Date().toISOString();
  const dateFmt = `[${d.slice(0, 10)} ${d.slice(11, 19)}]`;
  const s = `${dateFmt} "${req.method} ${req.url} ${req.proto}" ${res.status}`;
  log(s);
  return res;
}

async function isFile(fileName: string): Promise<boolean> {
  try {
    const info = await Deno.stat(fileName)
    return info.isFile()
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return false; // File or directory exists
    } else { throw err; }
  }
}

export async function logIpHook(req: ServerRequest, res: Response) {
  const ipAddress = req.conn.remoteAddr.hostname ?? '';
  // Save IP
  const d = new Date().toISOString();
  const dateFmt = `[${d.slice(0, 10)} ${d.slice(11, 19)}]`;
  const s = `${dateFmt} "${req.method} ${req.url} ${req.proto}" ${res.status} -- ${ipAddress}\n`;
  // Append to logfile
  const logFile = '.logFile.txt';
  if (await isFile(logFile)) {
    // Write to file
    const file = await Deno.open(logFile, {write: true, read: true});
    Deno.write(file.rid, Encoder.encode(s));
  } else {
    // Create file
    Deno.writeFile(logFile, Encoder.encode(s));
  }
  return res;
}