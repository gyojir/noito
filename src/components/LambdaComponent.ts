import { Component } from '../libs/ecs/Component';
import { GameContext } from '../scenes/MainScene';

type LambdaFuncType = (dt: number, context: GameContext)=> void;
export class LambdaComponent extends Component {
  static family: number = Component.getFamily(LambdaComponent);
  lambda: LambdaFuncType;
  destroyFunc: Function | undefined;
  
  constructor(lambda: LambdaFuncType, destroyFunc?: Function) {
    super();
    this.lambda = lambda;
    this.destroyFunc = destroyFunc;
  }

  destroyed() {
    this.destroyFunc && this.destroyFunc();
  }
}