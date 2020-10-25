import { System } from '../libs/ecs/ecs';
import * as Core from '../libs/core/core';
import { existFilter, flatSingle } from '../libs/util/util';
import { CollisionUtil } from '../libs/util/CollisionUtil';
import { GameContext } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { MoveComponent } from '../components/MoveComponent';
import { MassComponent } from '../components/MassComponent';
import { PhysicsBodyComponent } from '../components/PhysicsBodyComponent';
import { MoveRestrictComponent } from '../components/MoveRestrictComponent';

export class PhysicsSystem extends System<GameContext> {
  gravity: number;
  iteration: number;
  constructor(gravity: number = -0.98, iteration: number = 1){
    super([PositionComponent, MoveComponent, MassComponent, PhysicsBodyComponent]);
    this.gravity = gravity;
    this.iteration = iteration;
  }

  update(dt: number, context: GameContext) {
    const entities = this.getEntities();
    // CollisionDetector.detect(entities, ()=>{});

    const platforms =
      flatSingle(
        this.world?.getEntities([MoveRestrictComponent])
          .map(e=> e.getComponent(MoveRestrictComponent))
          .filter(existFilter)
          .map(e=>e.lines) || []);

    entities.forEach(e=>{
      const pos = e.getComponent(PositionComponent);
      const move = e.getComponent(MoveComponent);
      const mass = e.getComponent(MassComponent);
      const coll = e.getComponent(PhysicsBodyComponent);
      if(pos === undefined ||
        move === undefined){
        return;
      }
      
      // 移動
      let gravityMove = move.getMove("gravity");
      if(mass !== undefined){
        gravityMove.y -= this.gravity;
      }
      
      let restrictMove = move.getMove("restrict");
      restrictMove.x = 0;
      restrictMove.y = 0;
      
      let total = new Core.Math.Vector2(move.totalMove());
      const v = CollisionUtil.restrictMoveCirclePlatform(platforms, coll?.radius || 1, total, pos);
      let restriction = v.clone().subtract(total); // 戻しベクトル
      
      // ぶつかってたら重力消す
      if(restriction.lengthSq() > Number.EPSILON){
        gravityMove.x = 0;
        gravityMove.y = 0;
      }
      // 再計算
      total = new Core.Math.Vector2(move.totalMove());
      restriction = v.clone().subtract(total);
      restrictMove.x = restriction.x;
      restrictMove.y = restriction.y;

    })
  }
}