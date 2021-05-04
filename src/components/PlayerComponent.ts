import { Component } from '../libs/ecs/Component';

export class PlayerComponent extends Component {
  static family: number = Component.getFamily(PlayerComponent);
  constructor(){
    super();
  }
}