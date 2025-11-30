import { BuildContext, Context, IteratorContext, blockWriteCall, iteratorContext } from '@lux/core/context';
import { VNode, vnodeComment } from './vnode';
import { AnyFunction, Func1, MaybeArray } from '@lux/core/types';
import { GenFn } from '@lux/compiler/ast/generator';
import { Computed, computed } from '@lux/core/responsive/computed';
import { isArray, isDef, isFunction, isObject, isUndef, isUndefOrEmpty } from '@lux/helpers/is';
import { LoopCondition } from '@lux/compiler/ast/loop';
import { warn } from '@lux/core/logging';
import { Subscriber } from '@lux/core/responsive/registry';
import { RuntimeFlags } from './component';

export abstract class Block {

  public context: WeakRef<Context>;
  public active: Set<Subscriber>; // Do we need this?
  public prev: MaybeArray<VNode>;
  public flags: RuntimeFlags;

  constructor(context: Context) {
    this.context = new WeakRef(context);
    this.active = new Set();
    this.flags = RuntimeFlags.NONE;
  }

  public abstract gen(): MaybeArray<VNode>;
}

export class ConditionBlock extends Block {

  private _genGetter: Computed<GenFn>;
  private _branches: Array<[Func1<any, any>, GenFn]>;
  private _rendered: Map<GenFn, VNode>;

  constructor(context: Context, branches: Array<[Func1<any, any>, GenFn]>) {
    super(context);
    this._branches = branches;
    this._rendered = new Map<GenFn, VNode>();
  }

  private getGenGetter() {
    if (isUndef(this._genGetter)) {
      this._genGetter = computed(() => {
        let ctx = this.context.deref();
        if (isUndef(ctx)) {
          return null;
        }
        const [, gen] = this._branches.find(([cond]) => !!blockWriteCall(ctx, cond));
        return gen;
      });
    }
    return this._genGetter;
  }

  public gen(): VNode {
    const ctx = this.context.deref();
    if (isDef(ctx)) {
      const _gen = this.getGenGetter().value;
      if (isFunction(_gen)) {
        let out = this._rendered.get(_gen);
        if (isUndef(out)) {
          this._rendered.set(_gen, out = _gen(ctx) as VNode);
        }
        return out;
      }
    }
    return vnodeComment();
  }
}

export class LoopBlock extends Block {

  private _loop: LoopCondition;
  private _body: GenFn;
  private _key?: AnyFunction;
  private _listGetter: Computed<Array<any>>;
  private _keyedVNodes: Map<any, VNode>;
  private _iterCtx: WeakRef<IteratorContext>;

  constructor(context: BuildContext, loop: LoopCondition, body: GenFn, key?: AnyFunction) {
    super(context);
    this._loop = loop;
    this._body = body;
    this._key = key;
    this._keyedVNodes = new Map<any, VNode>();
  }

  private getListGetter() {
    if (isUndef(this._listGetter)) {
      this._listGetter = computed(() => {
        let ctx = this.context.deref();
        return isUndef(ctx) ? null : blockWriteCall(ctx, this._loop.items.fn);
      });
    }
    return this._listGetter;
  }

  private getIterContext() {
    if (isUndef(this._iterCtx?.deref())) {
      // Do we need a WeakRef here?
      let ctx = iteratorContext(this._loop.alias, null, this.context.deref());
      this._iterCtx = new WeakRef<IteratorContext>(ctx);
    }
    return this._iterCtx.deref();
  }

  public gen(): MaybeArray<VNode> {
    const list = this.getListGetter().value;
    if (!isArray(list) && !isObject(list)) {
      return vnodeComment();
    }
    let nodes: Array<VNode> = [];
    let keys = new Set<any>();

    let iterCtx = this.getIterContext();
    for (let i in list) {

      iterCtx.item = list[i]; // reset item going down.

      // calculate key for current item.
      let key = isFunction(this._key) ? blockWriteCall(iterCtx, this._key) : i;

      if (keys.has(key)) {
        warn(`Duplicate key in #loop: "${key}".`);
        continue; // Maybe continue.
      } else {
        keys.add(key);
      }

      let v = this._keyedVNodes.get(key);
      if (isUndef(v)) {
        v = this._body(iterCtx) as VNode;
        v.context = iterCtx;
        v.key = key;
      }
      nodes.push(v);
      iterCtx = iteratorContext(this._loop.alias, iterCtx.item[i], this.context.deref());
    }
    return nodes;
  }
}


