
export type Simple = boolean|string|number|null|undefined;
export type MaybeArray<T> = Array<T>|T;
export type AnyFunction = (...args: Array<any>) => any;
export type IdentityFactory<T> = (a: T) => ((p?: T|any) => T);
export type Func2<T1, T2, R> = (a: T1, b: T2) => R;
export type Func1<T, R> = (a: T) => R;
export type Func0<R> = () => R;
export type Action = () => void;

export interface Renderable extends Element {
  __keep?: boolean;
};