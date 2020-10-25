import { System } from '../libs/ecs/ecs';
import { GameContext } from '../scenes/MainScene';
import { LambdaComponent } from '../components/LambdaComponent';

export class LambdaSystem extends System<GameContext> {
  constructor(){
    super([LambdaComponent]);
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