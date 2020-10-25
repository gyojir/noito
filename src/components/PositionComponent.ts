import { Component } from '../libs/ecs/Component';
import { Camera } from '../libs/view/Camera';

export class PositionComponent extends Component {
  static family: number = Component.getFamily(PositionComponent);
  x: number = 0;
  y: number = 0;

  getScreenPos(camera: Camera){
    return {
      x: this.x - camera.pos.x,
      y: this.y - camera.pos.y
    }
  }
}