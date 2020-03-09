import { bgRed, magenta, bgMagenta, green, bgGreen, bgBlue } from 'https://deno.land/std/fmt/colors.ts';

export function error(msg: string) {
  bgRed(msg);
  bgRed('Exiting...')
  Deno.exit()
}

export function success(msg: string) {
  bgGreen(msg)
}

export function log(msg: string) {
  magenta(msg)
}