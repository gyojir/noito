import { System } from '../libs/ecs/ecs';
import * as Core from '../libs/core/core';
import { GameContext } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { CollideableComponent } from '../components/CollideableComponent';
import { EnemyComponent } from '../components/EnemyComponent';
import { CommonInfoComponent } from '../components/CommonInfoComponent';
import { BulletType } from '../components/BulletComponent';
import { MoveComponent } from '../components/MoveComponent';
import { clamp } from '../libs/util/util';
import InputManager from '../input/InputManager';
import { Key } from 'ts-key-enum';

export class PlayerSystem extends System<GameContext> {
  constructor(){
    super([PlayerComponent, CollideableComponent]);
  }
  
  update(dt: number, context: GameContext){
    let count = 0;

    this.forEach(e=>{
      count++;
      const pos = e.getComponent(PositionComponent);
      const coll = e.getComponent(CollideableComponent);
      const info = e.getComponent(CommonInfoComponent);
      const move = e.getComponent(MoveComponent);

      if(this.world === undefined ||
         pos === undefined ||
         coll === undefined ||
         info === undefined ||
         move === undefined){
        return;
      }

      // 移動
      let mv = move.getMove("move");
      mv.x *= 0.8;
      mv.y *= 0.8;
      // ジャンプ用
      let gravityMove = move.getMove("gravity");


      const key = InputManager.Instance.keyboard;
      const pointer = InputManager.Instance.pointer;

      if (key.isDown(Key.ArrowLeft)){
        mv.x += -3;
      }
      else if(key.isDown(Key.ArrowRight)){
        mv.x += 3;
      }

      if(pointer.data.down){
        mv.x += Math.min(-pointer.data.velocity.x * 0.01, 0);
      }
      if(pointer.data.down){
        mv.x += Math.max(-pointer.data.velocity.x * 0.01, 0);
      }

      if(
        key.isTriggered(Key.ArrowUp) || 
        (pointer.data.justUp && !pointer.data.swiped)){
        gravityMove.y = -15;
      }

      mv.x = clamp(mv.x, 20, -20);

      // コリジョン取得
      for(let opposite of coll.hitList){
        const enemy = opposite.getComponent(EnemyComponent);
        if(enemy !== undefined){
          info.active = false; // 死亡
          return;
        }
      }

      // 1000msなら必ずtrue つまり大体1sにx体
      if(Math.random() < dt * 0.001 * 10){
        const dir = new Core.Math.Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize();
        context.createBullet(this.world, pos, dir, BulletType.Player);
      }
    })

    if(count === 0 &&
      this.world !== undefined){
      context.score = 0;
      context.createPlayer(this.world);
    }
  }
}