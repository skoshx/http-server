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
$ deno install --allow-net --allow-read --allow-run http-server https://deno.land/x/http-server/cli.ts
```

###### Download

- [Normal](https://raw.githubusercontent.com/SkoshRG/http-server/master/index.ts)

## Usage

```shell
http-server --dark --root public
```

## Usage (Programmatic)

```js
import { HttpServer } from 'https://raw.githubusercontent.com/SkoshRG/http-server/master/index.ts';

const serverOptions = {
  port: 3000,
  open: false
};
const httpServer = new HttpServer(serverOptions);
console.log(`Server started on http://localhost:${httpServer.options.port}`);
```