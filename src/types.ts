module Lux {
  export type Key = string|number;
  export type State = Record<Key, any>
  export type UndefType = null|undefined;
  export type ArrayOrSingle<T> = Array<T>|T;
  export type ArrayOrRecord = Array<any> | Record<Key, any>;
  export type VNodeOrBlock = VNode|Block;
  export type Primitive = string|number|symbol|boolean;
  export type Renderable = VNode|Block|string;
  export type CreateAppFunction = (state: State) => VNode;
  export type PatchFunction = ($el: Element) => Element;
  export type IfStatement = (state: State) => boolean;
  export type LoopStatement = (items: ArrayOrRecord, key: Key) => boolean;
  export type BindStatement = (state: State) => boolean;
  export type VNodeOperations = {
    $if?: IfStatement,
    $loop?: LoopStatement,
    $bind?: BindStatement,
  };
}
