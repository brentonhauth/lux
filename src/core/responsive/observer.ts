import { isDef } from '@lux/helpers/is';
import {
  activateSub,
  getActive,
  SubFlags,
  Subscriber,
  subscribe,
  unsubscribe
} from './registry';


export class Observer {

  public subs: Set<Subscriber>;

  constructor() {
    this.subs = new Set<Subscriber>();
  }

  public track() {
    const active = getActive();
    if (isDef(active)) {
      active.flags &= ~SubFlags.UNUSED;
      subscribe(active, this);
    }
  }

  notify() {
    for (let sub of this.subs) {
      sub.flags |= SubFlags.DIRTY | SubFlags.UNUSED;
      activateSub(sub);
    }
    this.cleanup();
  }

  cleanup() {
    for (let sub of this.subs) {
      if (sub.flags & SubFlags.UNUSED) {
        unsubscribe(sub, this);
      }
    }
  }
}
