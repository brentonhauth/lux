module lux {
  export class ASTElement {
    public tag: string;
    public attrs: string;
    public children: ArrayOrSingle<ASTElement>;
    constructor() {
    }
  }
}
