import { ArrayOrSingle } from "../types";
import { isArray, isDef } from "./is";

export class Pool<T> {
  private items: Array<T>;

  constructor(items?: Array<T>) {
    this.items = isDef(items) ? items : [];
  }

  public get size() { return this.items.length; }

  public push(items: ArrayOrSingle<T>) {
    if (isArray(items)) {
      this.items.push(...items);
    } else {
      this.items.push(items);
    }
  }

  public pop(amount=1): ArrayOrSingle<T> {
    if (amount <= 0) {
      return null;
    } else if (amount === 1) {
      return this.items.shift();
    } else {
      let popped: T[] = [];
      amount = Math.min(amount, this.size);
      for (let i = 0; i < amount; i++) {
        popped.push(this.items.shift());
      }
      return popped;
    }
  }

  public popAll(): Array<T> {
    let items = this.items;
    this.items = [];
    return items;
  }
}
