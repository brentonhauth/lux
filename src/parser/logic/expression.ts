module lux {
  export class Expression {

    private _exp: (a: any) => any;

    constructor(exp: (a:any)=>any) {
      if (is.fn(exp)) {
        this._exp = exp;
      } else if (is.string(exp)) {
        console.warn('Cannot parse strings yet');
        this._exp = identity;
      }
    }

    public evaluate(state: State): any {
      return this._exp(state);
    }
  }
}