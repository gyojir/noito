import { System } from '../libs/ecs/ecs';
import { GameContext } from '../scenes/MainScene';
import { GeneratorComponent } from '../components/GeneratorComponent';
import { World } from '../libs/ecs/World';

export class GeneratorSystem extends System<GameContext> {
  constructor(world: World){
    super(world, [GeneratorComponent]);
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