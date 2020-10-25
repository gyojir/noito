import { Component } from '../libs/ecs/ecs';

export class PhysicsBodyComponent extends Component {
  static family: number = Component.getFamily(PhysicsBodyComponent);
  radius: number = 0;
  
  constructor(radius?: number) {
    super();
    this.radius = radius || 0;
  }
}