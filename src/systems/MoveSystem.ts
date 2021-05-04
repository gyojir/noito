import { System } from '../libs/ecs/ecs';
import { GameContext } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { MoveComponent } from '../components/MoveComponent';
import { clamp } from '../libs/util/util';
import { World } from '../libs/ecs/World';

export class MoveSystem extends System<GameContext> {
  constructor(world: World){
    super(world, [PositionComponent, MoveComponent]);
  }

  update(dt: number, context: GameContext) {
    this.forEach(e=>{
      const pos = e.getComponent(PositionComponent);
      const move = e.getComponent(MoveComponent);
      if(pos === undefined ||
        move === undefined){
        return;
      }

      const mv = move.totalMove();
      pos.x += mv.x;
      pos.y += mv.y;

      if(move.areaWidth > 0) {
        pos.x = clamp(pos.x, -move.areaWidth / 2, move.areaWidth / 2);
      }
      if(move.areaHeight > 0) {
        pos.y = clamp(pos.y, -move.areaHeight / 2, move.areaHeight / 2);
      }
    })
  }
}