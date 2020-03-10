import { bgRed, magenta, bgMagenta, green, bgGreen, bgBlue } from 'https://deno.land/std/fmt/colors.ts';

export function error(msg: string) {
  console.log(bgRed(msg));
  console.log(bgRed('Exiting...'));
  Deno.exit();
}

export function success(msg: string) {
  console.log(bgGreen(msg));
}

export function log(msg: string) {
  // console.log(bgMagenta(msg));
  console.log(msg);
}