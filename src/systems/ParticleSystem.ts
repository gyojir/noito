import { World, System } from '../libs/ecs/ecs';
import { PositionComponent } from '../components/PositionComponent';
import { GameContext } from '../scenes/MainScene';
import { EnemyComponent } from '../components/EnemyComponent';
import { ParticleComponent } from '../components/ParticleComponent';

export class ParticleSystem extends System<GameContext> {
  constructor(){
    super([ParticleComponent]);
  }

  update(dt: number, context: GameContext) {
    this.forEach(e=>{
      const particle = e.getComponent(ParticleComponent);
      if(particle === undefined){
        return;
      }

      particle.updator(dt * 0.001);
    })
  }
}