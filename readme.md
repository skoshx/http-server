# http-server for Deno

> http-server is a tiny and zero-configuration HTTP server to serve static files

## Features

- Really simple API & CLI usage
- Hooks
- Authentication
- Beautifully styled front-end
- Dark mode

## Install

```
$ deno install script
```

###### Download

- [Normal](https://path.to.file)
- [Minified](https://path.to.file)

## Usage

```shell
http-server --dark --root public
```

## Usage (Programmatic)

```js
import { HttpServer } from 'https://deno.land/std@v0.35.0/fs/mod.ts';

const serverOptions = {
  port: 3000,
  open: false
};
const httpServer = new HttpServer(serverOptions);
console.log(`Server started on http://localhost:${httpServer.options.port}`);
```