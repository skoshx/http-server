import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { HttpServer } from './index.ts';

// Tests for CLI

// Tests for HttpServer
Deno.test({
  name: 'httpServer works without any options',
  fn(): void {
    const httpServer = new HttpServer();
  }
});

Deno.runTests()

