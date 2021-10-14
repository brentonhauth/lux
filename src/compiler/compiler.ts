module Lux {

  const ignoreAttrs = ['class', 'style', 'loop', 'if', 'elif', 'else'];
  const bindingRE = /^:/g;
  const whitespacesRE = /^\s*$/;

  export function compileFromDOM(el: Element|Node): ASTNode {
    return _compileFromDOM(el);
  }

  function _compileFromDOM(el: Element|Node): ASTNode {
    let ast: ASTNode;
    if (el.nodeType === Node.TEXT_NODE) {
      ast = whitespacesRE.test(el.textContent) ? null
        : new ASTText(el, el.textContent);
    } else if (el.nodeType === Node.ELEMENT_NODE) {
      const elm = <Element>el, attrNames = elm.getAttributeNames();
      const attrs: VNodeAttrs = {}, children: Array<ASTNode> = [];
      let flags = 0; // default
      let inIf = false;
      let prev: ASTElement = null;

      for (let name of attrNames) {
        name = name.toLowerCase();
        attrs[name] = elm.getAttribute(name);
        if (bindingRE.test(name)) {
          flags |= ASTFlags.BIND;
          // TODO: Add bindings to list
        }
      }
      for (let i = 0; i < elm.childNodes.length; i++) {
        const node = elm.childNodes[i];
        const compiled = compileFromDOM(node);
        if (is.undef(compiled)) {
          continue;
        } else if (compiled.type !== ASTType.ELEMENT) {
          children.push(compiled);
          inIf = false;
          continue;
        }

        const child = <ASTElement>compiled;
        if (is.def(child.attrs['if'])) {
          inIf = true;
          child.flags |= ASTFlags.IF;
          child.if = {
            exp: String(child.attrs['if']),
            next: null,
          };
          sanitizeUniqueAttrs(prev = child, 'if');
          children.push(child);
        } else if (inIf && is.def(child.attrs['elif'])) {
          child.flags |= ASTFlags.ELIF;
          prev.if.next = child;
          child.if = {
            exp: String(child.attrs['elif']),
            next: null,
          };
          sanitizeUniqueAttrs(prev = child, 'elif');
        } else if (inIf && is.def(child.attrs['else'])) {
          prev.if.next = child;
          child.flags |= ASTFlags.ELSE;
          sanitizeUniqueAttrs(child, 'else');
          inIf = false;
          prev = null;
        } else {
          inIf = false;
          if (is.def(child.attrs['loop'])) {
            parseLoop(child);
            sanitizeUniqueAttrs(child, 'loop');
          }
          children.push(child);
        }

      }
      ast = new ASTElement(elm, elm.tagName, attrs, children);
      ast.flags |= flags;
    }
    return ast;
  }

  function sanitizeUniqueAttrs(el: ASTElement, keep: string) {
    const unique = ['loop', 'if', 'elif', 'else'];
    for (let u of unique) {
      if (u !== keep && u in el.attrs) {
        console.warn(`Cannot have "${u}" attribute with "${keep}".`);
        delete el.attrs[u];
      } else if (is.def(el.attrs[`:${u}`])) {
        console.warn(`"${u}" is not meant to be bound!`);
        delete el.attrs[u];
      }
    }
  }
}
