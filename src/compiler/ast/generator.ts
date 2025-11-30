import { MaybeArray, Func1, AnyFunction } from '@lux/core/types';
import { BuildContext, Context, IteratorContext, blockWriteCall, iteratorContext } from '@lux/core/context';
import { VNode, VNodeAttrs, VNodeFlags, vnode, vnodeBlock, vnodeComment, vnodeComponent, vnodeText } from '@lux/vdom/vnode';
import { isArray, isDef, isFunction, isObject, isUndef } from '@lux/helpers/is';
import { EMPTY_STRING } from '@lux/helpers/strings';
import { TRUE, cached } from '@lux/helpers/common';
import {
  ASTCondition,
  ASTComponent,
  ASTExpression,
  ASTHtml,
  ASTLoop,
  ASTNode,
  ASTText,
  ASTType
} from './astnode';
import { type Computed, computed } from '@lux/core/responsive/computed';
import { Expression } from './expression';
import { ASTAttributes } from './attributes';
import { BiMap } from '@lux/helpers/bimap';
import { error, warn } from '@lux/core/logging';
import { ConditionBlock, LoopBlock } from '@lux/vdom/block';

export type GenFn = Func1<Context, MaybeArray<VNode>>;
type AttrCache = BiMap<Context, string, Computed>;


const weakRefContext = (ctx: Context|WeakRef<Context>, fn: Func1<any, any>): AnyFunction => {
  const rctx = (ctx instanceof WeakRef) ? ctx : new WeakRef<Context>(ctx);
  return () => {
    const ctx = rctx.deref();
    if (isDef(ctx)) {
      return blockWriteCall(ctx, fn);
    }
  };
};


const eventMaskCache = new BiMap<Context, Func1<any, any>, Func1<Event, any>>();

const maskEvent = (ctx: Context, fn: Func1<any, any>): Func1<Event, any> => {
  const rtx = new WeakRef<Context>(ctx);
  return eventMaskCache.getDefault(ctx, fn, () => (
    (e: Event) => {
      // const ctx = rtx.deref(); // current bug with WeakRef
      if (isUndef(ctx)) {
        return;
      }
      const couldWrite = ctx.canWrite;
      ctx.event = e;
      ctx.canWrite = true;
      try {
        const result = fn(ctx.data);
        // Helps to handle either @event="fn" and @event="fn()"
        return isFunction(result) ? result(e) : result;
      } catch (r) {
        error('Issue with callback event', e);
      } finally {
        ctx.canWrite = couldWrite;
        ctx.event = undefined;
      }
    }
  ));
};



/**
 * [Work flow]:
 * (+) <Component />
 *   -> Component Instance
 *   -> State
 *   -> VNode Tree
 *   -> Diff/Render
 */


/**
 * TODO:
 *  - scope context (can only add to scope through Loop or Component)
 */


export function generator(root: ASTNode): GenFn {
  return root.gen || (root.gen = makeGenerator(root));
}


function makeGenerator(node: ASTNode): GenFn {
  switch (node?.type) {
    case ASTType.HTML:
      return makeHtmlGen(<ASTHtml>node);
    case ASTType.EXPRESSION:
      return makeExpressionGen(<ASTExpression>node);
    case ASTType.COMPONENT:
      return makeComponentGen(<ASTComponent>node);
    case ASTType.TEXT:
      return makeTextGen(<ASTText>node);
    case ASTType.CONDITION:
      return makeConditionGen(<ASTCondition>node);
    case ASTType.LOOP:
      return makeLoopGen(<ASTLoop>node);
    case ASTType.NONE:
    default:
      throw new Error('Issue with node in generator.');
  }
}


function makeVNodeAttrs(cache: AttrCache, ctx: Context, attrs: ASTAttributes): VNodeAttrs {
  if (isUndef(attrs)) {
    // TODO: Have default set of attributes, or
    return {
      statics: {},
      dynamics: {},
      events: null,
      styles: null,
      classes: null,
    };
  }

  const dynamics: { [key: string]: Computed<any> } = {};
  for (let key in attrs.dynamics) {
    let exp = attrs.dynamics[key];
    let com = cache.get(ctx, key);

    if (isUndef(com)) {
      com = computed(weakRefContext(ctx, exp.fn));
      cache.set(ctx, key, com);
    }
    dynamics[key] = com;
  }

  const events: Record<string, Func1<Event, any>> = {};
  for (let name in attrs.events) {
    events[name] = maskEvent(ctx, attrs.events[name].fn);
  }

  let stylesFn = (<Expression>attrs?.styles)?.fn;
  let classesFn = (<Expression>attrs?.classes)?.fn;

  return {
    statics: attrs.statics,
    dynamics,
    events,
    styles: stylesFn && computed(weakRefContext(ctx, stylesFn)),
    classes: classesFn && computed(weakRefContext(ctx, classesFn)),
  };
}

function makeHtmlGen(node: ASTHtml): GenFn {
  const attrs = node.attrs;
  const attrCache = new BiMap<BuildContext, string, Computed>();
  if (node.children.length === 0) {
    return ctx => {
      const vnodeAttrs = makeVNodeAttrs(attrCache, ctx, attrs);
      return vnode(node.tag, vnodeAttrs, [], VNodeFlags.NONE, <any>node.$el);
    };
  }

  const childGens = node.children.map(n => generator(n));
  return ctx => {
    const children: Array<VNode> = childGens.map(gen => gen(ctx)).flat();
    const vnodeAttrs = makeVNodeAttrs(attrCache, ctx, attrs);
    return vnode(node.tag, vnodeAttrs, children, VNodeFlags.NONE, <any>node.$el);
  };
}


function makeComponentGen(node: ASTComponent): GenFn {
  const { component: Comp, attrs } = node;
  const attrCache = new BiMap<Context, string, Computed>();

  return ctx => {
    // Generate root
    Comp.compile();
    // TODO: (Important!) Grab component instance if possible.

    /**
     * TODO:
     *   - evaluate ctx and pass to props
     *   -
     */
    const vnodeAttrs = makeVNodeAttrs(attrCache, ctx, attrs);

    return vnodeComponent(Comp, vnodeAttrs, /* INSTANCE */ null);
  };
}


function makeExpressionGen(node: ASTExpression): GenFn {
  const expFn = node.exp.fn;
  const cache = new WeakMap<Context, [Computed, Computed<VNode>]>();
  return ctx => {
    let result = cache.get(ctx);
    if (isUndef(result)) {
      let exp = computed(weakRefContext(ctx, (data) => {
        let value = expFn(data);
        return isDef(value) ? String(value) : EMPTY_STRING;
      }));
      let vnode = computed(() => vnodeText(exp.value));
      result = [exp, vnode];
      cache.set(ctx, result);
    }
    return result[1].value;
  };
}


const vnodeTextFactory = cached((text: string) => (() => vnodeText(text)));
function makeTextGen(node: ASTText): GenFn {
  return vnodeTextFactory(node.text);
}

function makeConditionGen(node: ASTCondition): GenFn {

  // Accumulate all branches
  const branches: Array<[AnyFunction, GenFn]> = [];

  let current: ASTNode = node;
  while (isDef(current) && current instanceof ASTCondition) {
    branches.push([
      current.condition.fn,
      generator(current.then)
    ]);
    current = current.next;
  }

  branches.push([
    TRUE, // else is always true
    isDef(current) ? generator(current) : () => vnodeComment()
  ]);

  const cache = new WeakMap<Context, ConditionBlock>();

  return ctx => {
    let block = cache.get(ctx);
    if (isUndef(block)) {
      block = new ConditionBlock(ctx, branches);
      cache.set(ctx, block);
    }

    return vnodeBlock(block);
  };
}

/**
 * @deprecated Moving towards block logic
 */
function __makeConditionGen(node: ASTCondition): GenFn {
  return null;
  // const condFn = node.condition.fn;
  // const thenGen = generator(node.then);
  // const nextGen = isDef(node.next) ? generator(node.next) : () => vnodeComment();

  // const cache = new WeakMap<Context, [Computed<boolean>, Computed<MaybeArray<VNode>>]>();

  // const gen: GenFn = ctx => {
  //   let result = cache.get(ctx);
  //   const rtx = new WeakRef(ctx);
  //   if (isUndef(result)) {
  //     let cond = computed(weakRefContext(ctx, data => !!condFn(data)));
  //     let vdom = computed(() => cond.value ? thenGen(rtx.deref()) : nextGen(rtx.deref()));
  //     result = [cond, vdom];
  //     cache.set(ctx, result);
  //   }

  //   const v = result[1].value;
  //   const genPass = () => gen(rtx.deref());
  //   if (isArray(v)) {
  //     v.forEach(n => {
  //       n.flags |= VNodeFlags.IF;
  //       (n as any).gen = genPass;
  //     });
  //   } else {
  //     v.flags |= VNodeFlags.IF;
  //     (v as any).gen = genPass;
  //   }

  //   return v;
  // };

  // return gen;
}


function makeLoopGen(node: ASTLoop): GenFn {
  const bodyGen = generator(node.body);
  const condition = node.condition;
  const keyFn = node.key?.fn;

  const cache = new WeakMap<Context, LoopBlock>();

  return ctx => {
    let block = cache.get(ctx);
    if (isUndef(block)) {
      block = new LoopBlock(<any>ctx, condition, bodyGen, keyFn);
      cache.set(ctx, block);
    }
    return vnodeBlock(block);
  };
}

/**
 * @deprecated Moving towards block logic
 */
function __makeLoopGen(node: ASTLoop): GenFn {
  const bodyGen = generator(node.body);
  const { alias, items: { fn: itemsFn } } = node.condition;
  const keyFn = node.key.fn;

  const itemsCache = new WeakMap<Context, Computed>();
  const iterCache = new BiMap<Context, any, IteratorContext>();
  const keyToVNode = new WeakMap<any, VNode>();
  return ctx => {
    let items = itemsCache.get(ctx);
    if (isUndef(items)) {
      items = computed(() => blockWriteCall(ctx, itemsFn));
      itemsCache.set(ctx, items);
    }

    if (!isArray(items.value) && !isObject(items.value)) {
      return vnodeComment();
    }


    // TODO: REWORK THIS LOGIC!!!

    const keys = new Set<any>();

    const vnodes: Array<VNode> = [];
    for (let i in items.value) {
      let itemGetter = () => items.value[i];

      let iterCtx = iterCache.getDefault(ctx, itemGetter(), () => {
        return iteratorContext(alias, itemGetter, ctx);
      });

      let key = keyFn(iterCtx);

      if (keys.has(key)) {
        warn('Duplicate key in #loop.');
      } else {
        keys.add(key);
      }

      let v = keyToVNode.get(key);
      if (isUndef(v)) {
        v = bodyGen(<any>iterCtx) as VNode; // Can only be a vnode
        v.context = <any>iterCtx;
        keyToVNode.set(key, v);
      }
      vnodes.push(v);
    }
    return vnodes;
  }
}
