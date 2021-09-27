module lux {

  export const is = {
    array: Array.isArray,
    string: (a: any): a is string => typeof a === 'string',
    number: (a: any): a is number => typeof a === 'number',
    primitive: (a: any): a is Primitive => (
      typeof a === 'string' ||
      typeof a === 'number' ||
      typeof a === 'symbol' ||
      typeof a === 'boolean'
    ),
    objectLike: (a: any) => a && typeof a === 'object',
    object: (a: any) => is.objectLike(a) && !is.array(a),
    undef: (a: any): a is UndefType => a === undefined || a === null,
    def: (a: any) => a !== undefined && a !== null,
    fn: (a: any) => typeof a === 'function',
    textNode: (a: Node) => a.nodeType === Node.TEXT_NODE,
    element: (a: any): a is Element => a instanceof Element,
    block: (a: any): a is Block => a instanceof Block,
    vnode: (a: any): a is VNode => a instanceof VNode,
  };
}
