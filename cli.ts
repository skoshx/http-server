#!/usr/bin/env -S deno --allow-net

import { parse } from "https://deno.land/std/flags/mod.ts";
import { HttpServerOptions, HttpServer } from './index.ts';
import { success } from './log.ts';
const { args } = Deno;

// Parse command line options
const parsedArgs = parse(args);

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
  contentType: getContentTypeByExtension(parsedArgs.ext || ''),
  logIp: parsedArgs.logIp || false,
  ssl: parsedArgs.ssl || false,
  cert: parsedArgs.cert || '',
  key: parsedArgs.key || '',
  auth: parsedArgs.auth || false,
  username: parsedArgs.username || '',
  password: parsedArgs.password || '',
}

const httpServer = new HttpServer(defaultServerOptions)
success(`Server started on http://localhost:${httpServer.options.port}`);