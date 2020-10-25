import { System } from '../libs/ecs/ecs';
import { GameContext } from '../scenes/MainScene';
import { GeneratorComponent } from '../components/GeneratorComponent';

export class GeneratorSystem extends System<GameContext> {
  constructor(){
    super([GeneratorComponent]);
  }

  update(dt: number, context: GameContext) {
    this.forEach(e=>{
      const compo = e.getComponent(GeneratorComponent);
      if(compo === undefined){
        return;
      }
      compo.generator.next();
    })
  }
}