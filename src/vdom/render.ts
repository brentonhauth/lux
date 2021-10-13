module Lux {
  export function $render(node: Renderable): Element {
    if (is.undef(node)) {
      return <any>dom.createComment('NULL');
    } else if (is.string(node)) {
      return <any>dom.createText(node);
    } else if (is.block(node)) {
      // TEMPORARY
      console.warn('FOUND BLOCK IN RENDER STEP', node);
      return <any>dom.createComment();
    }

    if (!node.tag) {
      node.$el = <any>dom.createComment('');
      return node.$el;
    }

    node.$el = dom.createElement(node.tag);
    applyAllAttrs(node);
    if (node.data?.props) {
      applyAll(node.$el, node.data.props);
    }
    if (node.data?.style) {
      applyAll((<any>node.$el).style, node.data.style);
    }

    if (is.def(node.children)) {
      let children = arrayWrap(node.children);
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

    return node.$el;
  }

  export function $mount(node: Element|VNode, target: Element): Element {
    if (is.element(node)) {
      target.appendChild(node);
      return node;
    } else if (is.undef(node.$el)) {
      node = clense(node, {});
      node.$el = $render(node);
    }
    target.appendChild(node.$el);
    return node.$el;
  }
}
