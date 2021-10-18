export function warn(msg: string, ...args: any[]) {
  if (args.length > 0) {
    console.warn(msg, ...args);
  } else {
    console.warn(msg);
  }
}