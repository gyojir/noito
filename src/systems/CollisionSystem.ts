import _ from 'lodash';
import { System } from '../libs/ecs/ecs';
import { GameContext } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { CollisionDetector, Candidate } from './CollisionDetector';
import { CollideableComponent } from '../components/CollideableComponent';

export class CollisionSystem extends System<GameContext> {
  constructor(){
    super([PositionComponent, CollideableComponent]);
  }

  update(dt: number, context: GameContext){
    const entities = this.getEntities().map(e=>{
      e.getComponent(CollideableComponent)?.clear();
      return e;
    });
    CollisionDetector.detect(entities, this.collided);
  }
    
  collided(left: Candidate,right: Candidate) {
    left.coll.hitList.push(right.entity);
    right.coll.hitList.push(left.entity);
  }
}