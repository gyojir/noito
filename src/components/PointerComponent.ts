import { Component } from '../libs/ecs/Component';

export class PointerComponent extends Component {
  static family: number = Component.getFamily(PointerComponent);
  scene: Phaser.Scene;
  constructor(scene: Phaser.Scene){
    super();
    this.scene = scene;
  }
}