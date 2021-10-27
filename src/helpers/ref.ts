export interface Reference<T> {
  value: T,
  get(): T,
  set(a:T): boolean,
  __isRef: true
};

export function ref<T>(value?:T): Reference<T> {
  // TODO: Link references
  return {
    value,
    __isRef: true,
    get() {
      return this.value;
    },
    set(value:T) {
      this.value = value;
      return true;
    },
  };
}
