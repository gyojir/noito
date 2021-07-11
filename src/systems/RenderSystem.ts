import { System } from '../libs/ecs/ecs';
import * as Core from '../libs/core/core';
import { GameContext } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { GraphNodeComponent } from '../components/GraphComponent';
import { DirectionComponent } from '../components/DirectionComponent';
import { getAngle } from '../libs/util/util';
import { View } from '../libs/view/View';
import { World } from '../libs/ecs/World';

export class RenderSystem extends System<GameContext> {
  view: View;
  constructor(world: World, view: View){
    super(world, [GraphNodeComponent,PositionComponent]);
    this.view = view;
  }

  update(dt: number, context: GameContext) {
    this.forEach(e=>{
      const cpos = e.getComponent(PositionComponent);
      const cnode = e.getComponent(GraphNodeComponent);
      const dir = e.getComponent(DirectionComponent); // optional
      if(cpos === undefined ||
        cnode === undefined ||
        !cnode.node.visible){
        return;
      }

      if(cnode.rotate && dir !== undefined && context.view){
        cnode.node.rotation = getAngle(dir);
      }

      // const pos = this.view.transformWorldToView(cpos);
      cnode.node.position.x = cpos.x;
      cnode.node.position.y = cpos.y;
    })
  }
}