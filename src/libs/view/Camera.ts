import * as Core from '../core/core';

export class Camera {
  pos: Core.Math.Vector2;
  constructor(pos?: Core.Types.Math.Vector2Like){
    this.pos = new Core.Math.Vector2(pos);
  }
  
  update(container: PIXI.Container){
    container.x = -this.pos.x;
    container.y = -this.pos.y;
  }
}
