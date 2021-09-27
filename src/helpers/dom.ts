module lux {
  export const dom = {
    createElement: (tag: string): Element => document.createElement(tag),

    setAttr(el: Element, attr: string, value: any) {
      el.setAttribute(attr, value);
    },
    
    createText(text: string): Text {
      return document.createTextNode(text);
    },

    createComment(text='') {
      return document.createComment(text);
    }
  };
}
