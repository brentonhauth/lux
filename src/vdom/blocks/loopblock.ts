module lux {
  export class LoopBlock extends Block {
    constructor() {
      super();
    }

    public evaluate(state: State): ArrayOrSingle<string|VNode> {
      return null;
    }
  }
}
