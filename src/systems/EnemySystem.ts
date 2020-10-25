import { System } from '../libs/ecs/ecs';
import { GameContext } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { EnemyComponent } from '../components/EnemyComponent';
import { CollideableComponent } from '../components/CollideableComponent';
import { BulletComponent, BulletType } from '../components/BulletComponent';
import { CommonInfoComponent } from '../components/CommonInfoComponent';
import { MoveComponent } from '../components/MoveComponent';
import { DirectionComponent } from '../components/DirectionComponent';

export class EnemySystem extends System<GameContext> {
  constructor(){
    super([PositionComponent, EnemyComponent, CollideableComponent, MoveComponent, DirectionComponent]);
  }

  update(dt: number, context: GameContext) {
    this.forEach(e=>{
      const pos = e.getComponent(PositionComponent);
      const coll = e.getComponent(CollideableComponent);
      const info = e.getComponent(CommonInfoComponent);
      const move = e.getComponent(MoveComponent);
      const dir = e.getComponent(DirectionComponent);
      if(pos === undefined ||
         coll === undefined ||
         info === undefined ||
         move === undefined ||
         dir === undefined){
        return;
      }
      
      // コリジョン取得
      for(let opposite of coll.hitList){
        const bullet = opposite.getComponent(BulletComponent);
        if(bullet !== undefined && 
          bullet.type === BulletType.Player){
          info.active = false;
          return;
        }
      }
    })
  }
}