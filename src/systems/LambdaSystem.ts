import { System } from '../libs/ecs/ecs';
import { GameContext } from '../scenes/MainScene';
import { LambdaComponent } from '../components/LambdaComponent';
import { World } from '../libs/ecs/World';

export class LambdaSystem extends System<GameContext> {
  constructor(world: World){
    super(world, [LambdaComponent]);
  }

  update(dt: number, context: GameContext) {
    this.forEach(e=>{
      const compo = e.getComponent(LambdaComponent);
      if(compo === undefined){
        return;
      }
      compo.lambda(dt, context);
    })
  }
}