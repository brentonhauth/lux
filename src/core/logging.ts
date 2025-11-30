export function info(msg: string, ...args: Array<any>) {
  if (args.length > 0) {
    console.log(`[Lux Info]: ${msg}`, ...args);
  } else {
    console.log(`[Lux Info]: ${msg}`);
  }
}

export function warn(msg: string, ...args: Array<any>) {
  if (args.length > 0) {
    console.warn(`[Lux Warn]: ${msg}`, ...args);
  } else {
    console.warn(`[Lux Warn]: ${msg}`);
  }
}

export function error(msg: string, ...args: Array<any>) {
  if (args.length > 0) {
    console.error(`[Lux Error]: ${msg}`, ...args);
  } else {
    console.error(`[Lux Error]: ${msg}`);
  }
}
