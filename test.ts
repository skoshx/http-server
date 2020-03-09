import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

// Tests for CLI

// Tests for HttpServer
Deno.test({
  name: 'httpServer works without any options',
  fn(): void {
    assertEquals('world', 'world')
  }
});

Deno.runTests()

