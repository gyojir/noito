import { World, System } from '../libs/ecs/ecs';
import { PositionComponent } from '../components/PositionComponent';
import { GameContext } from '../scenes/MainScene';
import { EnemyComponent } from '../components/EnemyComponent';
import { CollideableComponent } from '../components/CollideableComponent';
import { BulletComponent, BulletType } from '../components/BulletComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { CommonInfoComponent } from '../components/CommonInfoComponent';
import { MoveComponent } from '../components/MoveComponent';
import { DirectionComponent } from '../components/DirectionComponent';

export class BulletSystem extends System<GameContext> {
  constructor(){
    super([PositionComponent, BulletComponent, CollideableComponent, MoveComponent, DirectionComponent]);
  }

  update(dt: number, context: GameContext) {
    this.forEach(e=>{
      const bullet = e.getComponent(BulletComponent);
      const coll = e.getComponent(CollideableComponent);
      const info = e.getComponent(CommonInfoComponent);
      const move = e.getComponent(MoveComponent);
      const dir = e.getComponent(DirectionComponent);
      if(bullet === undefined ||
         coll === undefined ||
         info === undefined ||
         move === undefined ||
         dir === undefined){
        return;
      }
            
      // コリジョン取得
      for(let opposite of coll.hitList){
        if(bullet.type === BulletType.Player &&
          opposite.getComponent(EnemyComponent) !== undefined){
          info.active = false;
          return;
        }else if(bullet.type === BulletType.Enemy &&
                opposite.getComponent(PlayerComponent) !== undefined){
          info.active = false;
          return;
        }
      }
    })
  }
}