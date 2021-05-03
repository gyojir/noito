import * as mugen from 'mu-gen';
import { System, World } from '../libs/ecs/ecs';
import * as Core from '../libs/core/core';
import { GameContext, Layer } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { CollideableComponent } from '../components/CollideableComponent';
import { EnemyComponent } from '../components/EnemyComponent';
import { CommonInfoComponent } from '../components/CommonInfoComponent';
import { BulletType, BulletComponent } from '../components/BulletComponent';
import { MoveComponent } from '../components/MoveComponent';
import { clamp } from '../libs/util/util';
import InputManager from '../input/InputManager';
import { Key } from 'ts-key-enum';

export class PlayerSystem extends System<GameContext> {
  constructor(world: World){
    super(world, [PlayerComponent, CollideableComponent]);
  }
  
  update(dt: number, context: GameContext){
    let count = 0;

    const key = InputManager.Instance.keyboard;
    const pointer = InputManager.Instance.pointer;

    this.forEach(e=>{
      count++;
      const pl = e.getComponent(PlayerComponent);
      const pos = e.getComponent(PositionComponent);
      const coll = e.getComponent(CollideableComponent);
      const info = e.getComponent(CommonInfoComponent);
      const move = e.getComponent(MoveComponent);

      if(this.world === undefined ||
         pl === undefined ||
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

      mv.x = clamp(mv.x, -20, 20);

      // コリジョン取得
      for(let opposite of coll.hitList){
        const enemy = opposite.getComponent(EnemyComponent);
        const bullet = opposite.getComponent(BulletComponent);
        if(enemy !== undefined || bullet?.type == BulletType.Enemy){
          info.active = false; // 死亡
          mugen.playSE(mugen.Presets.Explosion);
          return;
        }
      }

      if(context.app.ticker.lastTime - pl.lastShotTime > 100 &&  key.isDown(' ')){
        pl.lastShotTime = context.app.ticker.lastTime;
        const dir = new Core.Math.Vector2(0,-1);
        const bpos = new Core.Math.Vector2(pos).add(new Core.Math.Vector2(0,-50));
        context.createBullet(bpos, dir, 10, BulletType.Player);
      }
    })
  }
}