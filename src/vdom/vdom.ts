module Lux {
  /** @deprecated */
  export const $vdom = {
    $root: <Element>null,
    $v: <VNode>null,
    _createAppFn: <CreateAppFunction>null,

    createApp(fn: CreateAppFunction) {
      if (is.fn(fn)) {
        $vdom._createAppFn = fn;
      }
    },

    updateState(state: State) {
      const v: VNode = clense($vdom._createAppFn(state), state);
      if (is.undef(v)) {
        let c = <any>dom.createComment();
        $vdom.$root?.replaceWith(c);
        $vdom.$root = c;
        return $vdom.$v = null;
      }
      const patch = diff($vdom.$v, v);
      $vdom.$root = patch($vdom.$root);
      return $vdom.$v = v;
    },

    mount(el: string|Element) {
      if (is.string(el)) {
        el = document.querySelector(el);
      }
      $vdom.$v = $vdom._createAppFn({});
      return $vdom.$root = $mount($vdom.$v, el);
    },
  };
}
