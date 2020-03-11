#!/usr/bin/env -S deno --allow-net
import { parse } from "https://deno.land/std/flags/mod.ts";
import { HttpServerOptions, HttpServer } from './index.ts';
import { success } from './log.ts';

// Parse command line options
const { args } = Deno;
const parsedArgs = parse(args);

if (parsedArgs.help) {
  console.log(`
  HTTP File Server by Skosh

  Serves a local directory in HTTP.

  INSTALL:
    deno install --allow-net --allow-read http-server https://deno.land/std/http/file_server.ts

  USAGE:
    http-server [path] [options]

  OPTIONS:
    --help          Prints help information
    --port <PORT>   Set port
    --hostname <HOSTNAME> Set hostname
    --open          Open browser on server start
    --auth          Enable Basic HTTP Authentication
    --username      Username for authentication
    --password      Password for authentication
    --dark          Dark mode
    --cors          Enable CORS via the 'Access-Control-Allow-Origin' header
    --ssl           Enable HTTPS
    --cert          SSL Certificate file path
    --key           SSL Key file path
    --cache <CACHE> The amount of time for cache. -1 to disable caching.
    --dotFiles      Show dotfiles
    --dir           Show directories
    --autoIndex     Enable autoIndex
    --extension     Default file extension. Defaults to html
    --contentType   Set the content type
    --logIp         Log IP's of visitors`);
  Deno.exit();
}

const getContentTypeByExtension = (ext: string) => ext === 'html' ? 'text/html' : 'application/octet-stream';

const defaultServerOptions: HttpServerOptions = {
  root: parsedArgs.root || '.',
  port: parsedArgs.port || 8080,
  headers: parsedArgs.headers || [],
  hostname: parsedArgs.hostname || '0.0.0.0',
  cors: parsedArgs.cors || false,
  cache: parsedArgs.cache || 3600,
  dotFiles: parsedArgs.dotfiles || true,
  dir: parsedArgs.dir || true,
  autoIndex: parsedArgs.autoIndex || true,
  open: parsedArgs.open || true,
  extension: parsedArgs.ext || 'html',
  contentType: getContentTypeByExtension((parsedArgs.ext || 'html') || ''),
  logIp: parsedArgs.logIp || false,
  ssl: parsedArgs.ssl || false,
  cert: parsedArgs.cert || '',
  key: parsedArgs.key || '',
  auth: parsedArgs.auth || false,
  username: parsedArgs.username || '',
  password: parsedArgs.password || '',
  dark: parsedArgs.dark || false,
};
// Start server
const httpServer = new HttpServer(<string>parsedArgs._[0], defaultServerOptions);
success(`Server started on http://localhost:${httpServer.options.port}`);