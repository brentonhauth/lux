module lux {
  export function $render(node: VNode|string): Element {
    // console.log(`RENDER`, node);
    if (is.string(node)) {
      return <any>dom.createText(node);
    }

    node.$el = dom.createElement(node.tag);
    applyAllAttrs(node);

    if (is.def(node.children)) {
      let children = arrayWrap(node.children);
      if (is.array(children)) {
        children.forEach(c => {
          if (is.string(c)) {
            node.$el.appendChild(dom.createText(c));
          } else if (is.vnode(c)) {
            c.$el = $render(c);
            node.$el.appendChild(c.$el);
          } else if (is.block(c)) {
            console.warn('Does not yet support Blocks!');
          }
        });
      }
    }

    return node.$el;
  }

  export function $mount(node: Element|VNode, target: Element): Element {
    if (is.element(node)) {
      target.replaceWith(node);
      return node;
    } else if (is.undef(node.$el)) {
      node.$el = $render(node);
    }
    target.replaceWith(node.$el);
    return node.$el;
  }
}
