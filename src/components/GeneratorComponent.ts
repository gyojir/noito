import { Component } from '../libs/ecs/Component';
import { GameContext } from '../scenes/MainScene';

type GeneratorFuncType = ()=> Generator<any, void, unknown>;
export class GeneratorComponent extends Component {
  static family: number = Component.getFamily(GeneratorComponent);
  private lambda: GeneratorFuncType;
  generator: ReturnType<GeneratorFuncType>;
  
  constructor(lambda: GeneratorFuncType) {
    super();
    this.lambda = lambda;
    this.generator = this.lambda();
  }
}