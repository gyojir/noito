import { System } from '../libs/ecs/ecs';
import * as Core from '../libs/core/core';
import { GameContext } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { SpriteComponent } from '../components/SpriteComponent';
import { DirectionComponent } from '../components/DirectionComponent';
import { getAngle } from '../libs/util/util';
import { View } from '../libs/view/View';

export class RenderSystem extends System<GameContext> {
  view: View;
  constructor(view: View){
    super([SpriteComponent,PositionComponent]);
    this.view = view;
  }

  update(dt: number, context: GameContext) {
    this.forEach(e=>{
      const cpos = e.getComponent(PositionComponent);
      const sprite = e.getComponent(SpriteComponent);
      const dir = e.getComponent(DirectionComponent); // optional
      if(cpos === undefined ||
        sprite === undefined ||
        !sprite.sprite.visible){
        return;
      }

      if(dir !== undefined && context.view){
        sprite.sprite.rotation = getAngle(dir);
      }

      // const pos = this.view.transformWorldToView(cpos);
      sprite.sprite.position.x = cpos.x;
      sprite.sprite.position.y = cpos.y;
    })
  }
}