import { Component } from '../libs/ecs/ecs';

export enum BulletType {
  Player,
  Enemy,
}

export class BulletComponent extends Component {
  static family: number = Component.getFamily(BulletComponent);
  type: BulletType;
  
  constructor(type: BulletType) {
    super();
    this.type = type;
  }
}