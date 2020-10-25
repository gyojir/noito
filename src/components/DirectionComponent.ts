import { Component } from '../libs/ecs/Component';

export class DirectionComponent extends Component {
  static family: number = Component.getFamily(DirectionComponent);
  x: number = 0;
  y: number = 0;
  
  constructor() {
    super();
  }

  getRotation() {
    return Math.atan2(this.y, this.x);
  }
}