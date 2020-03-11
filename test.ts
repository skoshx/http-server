import { assertEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { HttpServer, HttpServerOptions } from './index.ts';

// Tests for CLI

// Tests for HttpServer
Deno.test({
  name: 'httpServer works without any options',
  fn(): void {
    const httpServer = new HttpServer();
    httpServer.stopServer();
  }
});

Deno.test({
  name: 'httpServer requires password and username for authentication',
  fn(): void {
    function create() {
      // @ts-ignore Dont check option structure
      new HttpServer(undefined, { auth: true });
    }
    assertThrows(create, Error);
  }
});

Deno.test({
  name: 'httpServer works with password and username for authentication',
  fn(): void {
    // @ts-ignore Dont check option structure
    const server = new HttpServer(undefined, { auth: true, password: 'p', username: 'u' })
    server.stopServer();
  }
});

Deno.test({
  name: 'generates pages correctly',
  fn(): void {
    const server = new HttpServer();
    const html = server.generateHTMLForDirectory('/', []);
    assertEquals(html, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Index of /</title>
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
      <h1>Index of /</h1>
      
      <p>Deno v0.35.0 | <a href="https://todo.link.to.repo">http-server</a> running @ 0.0.0.0:8080</p>
    </body>
    </html>
    `);
    server.stopServer();
  }
});

Deno.runTests()

