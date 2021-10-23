export const dom = {

  select: (query: string) => document.querySelector(query),

  createElement: (tag: string): Element => document.createElement(tag),

  setAttr(el: Element, attr: string, value: any) {
    el.setAttribute(attr, value);
  },
  
  removeAllChildren(el: Element) {
    while (el.childNodes.length) {
      el.removeChild(el.lastChild);
    }
  },
  
  createText(text: string): Text {
    return document.createTextNode(text);
  },

  createComment(text='') {
    return document.createComment(text);
  }
};
