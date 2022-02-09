import { safeIgnoreCaseEquals } from './strings';

interface DomApi {
  select(query: string): Element;
  createElement(tag: string): Element;
  removeAllChildren(el: Element): void;
  setAttr(el: Element, attr: string, value: any): void;
  getAttr(el: Element, attr: string): string;
  hasAttr(el: Element, attr: string): boolean;
  delAttr(el: Element, attr: string): void;
  createText(text: string): Text;
  createComment(text?: string): Comment;
  tagIs(el: Element, tag: string): boolean;
}


export const dom: DomApi = {

  select: (query: string) => document.querySelector(query),

  createElement: (tag: string): Element => document.createElement(tag),

  setAttr(el: Element, attr: string, value: any) {
    el?.setAttribute(attr, value);
  },

  getAttr(el: Element, attr: string) {
    return el.getAttribute(attr);
  },

  hasAttr(el: Element, attr: string) {
    return el.hasAttribute(attr);
  },

  delAttr(el: Element, attr: string) {
    el?.removeAttribute(attr);
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
  },

  tagIs(el: Element, tag: string): boolean {
    return safeIgnoreCaseEquals(el.tagName, tag);
  }
};
