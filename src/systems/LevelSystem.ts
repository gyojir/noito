import { System } from '../libs/ecs/ecs';
import * as Core from '../libs/core/core';
import { selectRand, randf } from '../libs/util/util';
import { GameContext } from '../scenes/MainScene';

export class LevelSystem extends System<GameContext> {
  constructor(){
    super([]);
  }

  update(dt: number, context: GameContext){
    if(this.world === undefined){
      return;
    }

    // 1000msなら必ずtrue つまり大体1sにx体
    const perSec = 5;
    if(Math.random() < dt * 0.001 * perSec){
      const aside = selectRand([
        {pos:{x: -1, y: randf(-1,1)}, dirOfs: {x: 0, y:-0.5}, dirMul: {x: 1, y:2}},
        {pos:{x: 1, y: randf(-1,1)}, dirOfs: {x: 0, y:-0.5}, dirMul: {x: -1, y:2}},
        {pos:{x: randf(-1,1), y: -1}, dirOfs: {x: -0.5, y:0}, dirMul: {x: 2, y:1}},
        {pos:{x: randf(-1,1), y:1}, dirOfs: {x: -0.5, y:0}, dirMul: {x: 2, y:-1}}
      ]);

      const pos = new Core.Math.Vector2();
      pos.x = aside.pos.x * (context.view?.width * 0.5 || 0) + context.view.camera.pos.x;
      pos.y = aside.pos.y * (context.view?.height * 0.5 || 0) + context.view.camera.pos.y;
      
      const dir = new Core.Math.Vector2(Math.random(), Math.random())
      .add(new Core.Math.Vector2(aside.dirOfs))
      .multiply(new Core.Math.Vector2(aside.dirMul))
      .normalize();

      context.createEnemy(this.world, pos, dir);
    }
  }
}