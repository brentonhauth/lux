module lux {
  export abstract class Block {
    public abstract evaluate(state: State): ArrayOrSingle<VNode|string>|UndefType;
  }
}
