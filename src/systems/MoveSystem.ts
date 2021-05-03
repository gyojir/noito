import { System } from '../libs/ecs/ecs';
import { GameContext } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { MoveComponent } from '../components/MoveComponent';
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
    })
  }
}