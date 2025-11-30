import { isUndef } from '@lux/helpers/is';
import { Observer } from './observer';
import { error } from '../logging';
import { BiMap } from '@lux/helpers/bimap';

export interface Runnable<T = any> {
  run(): T;
}

export const enum SubFlags {
  NONE = 0,
  DIRTY = 1,
  UNUSED = 2,
}

export interface Subscriber<T = any> extends Runnable<T> {
  observing: Set<Observer>;
  flags: SubFlags;
}

/**
 * Suggested to use intermediate class to hook together Subscribers + Observers.
 */
export class Hook {

  constructor(
    public sub: Subscriber,
    public observer: Observer,
  ) {}
}

const REGISTRY = new BiMap<object, any, Observer>();

let ACTIVE: Array<Subscriber> = []; // Stack

export const getActive = () => ACTIVE[ACTIVE.length - 1];

export const activateSub = <T = any>(sub: Subscriber<T>): boolean => {
  ACTIVE.push(sub);
  try {
    sub.run();
    return true;
  } catch (e) {
    error(e);
    return false;
  } finally {
    ACTIVE.pop();
  }
}

const observerFactory = () => new Observer();


export function track(target: object, key: string): void {
  if (isUndef(getActive())) {
    return;
  }

  let observer = REGISTRY.getDefault(target, key, observerFactory);
  observer.track();
}

export function notify(target: object, key: any) {
  const observer = REGISTRY.get(target, key);
  observer?.notify();
}

export function remove(target: object, key: any): boolean {
  return REGISTRY.delete(target, key);
}

export function unsubscribe(sub: Subscriber, from: Observer) {
  sub.observing.delete(from);
  from.subs.delete(sub);
}

export function subscribe(sub: Subscriber, to: Observer) {
  sub.observing.add(to);
  to.subs.add(sub);
}