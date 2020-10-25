import { Component } from '../libs/ecs/Component';

export class EnemyComponent extends Component {
  static family: number = Component.getFamily(EnemyComponent);
  constructor(){
    super();
  }
}