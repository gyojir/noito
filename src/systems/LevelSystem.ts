import { System } from '../libs/ecs/ecs';
import * as Core from '../libs/core/core';
import { selectRand, randf, ValueOf, randt } from '../libs/util/util';
import { GameContext, Layer } from '../scenes/MainScene';
import { MoveComponent } from '../components/MoveComponent';
import { PositionComponent } from '../components/PositionComponent';
import { DirectionComponent } from '../components/DirectionComponent';
import { EnemyComponent } from '../components/EnemyComponent';
import { CollideableComponent } from '../components/CollideableComponent';
import { CommonInfoComponent } from '../components/CommonInfoComponent';
import { Circle } from '../libs/util/Shape';
import { SpriteComponent } from '../components/SpriteComponent';
import TextureLists from '../scenes/TextureList';
import { GeneratorComponent } from '../components/GeneratorComponent';
import { GraphNodeComponent } from '../components/GraphComponent';
import { World } from '../libs/ecs/World';

export class LevelSystem extends System<GameContext> {
  lastEnemyTime = 0;
  constructor(world: World){
    super(world, []);
  }

  update(dt: number, context: GameContext){
    const createEnemy = (pos: Core.Math.Vector2, dir: Core.Math.Vector2) => {
      if(this.world === undefined){
        return;
      }

      let entity = this.world.createEntity();
      let cmov = entity.addComponent(MoveComponent);
      let cpos = entity.addComponent(PositionComponent);
      let cdir = entity.addComponent(DirectionComponent);
      entity.addComponent(EnemyComponent);
      entity.addComponent(CollideableComponent, new Circle(15));
      entity.addComponent(CommonInfoComponent);
      let cnode = entity.addComponent(GraphNodeComponent, context.view.container, cpos.x, cpos.y, Layer.Entity);
      entity.addComponent(SpriteComponent, cnode.node, context.loader.resources[TextureLists.Entity.key].texture, 0xFF2222);
      entity.addComponent(GeneratorComponent, function* () {
        // 移動
        while (true) {
          let mv = cmov.getMove("move");
          mv.x = cdir.x * 10;
          mv.y = cdir.y * 10;
          yield;
        }
      });

      cpos.x = pos.x;
      cpos.y = pos.y;
      cdir.x = dir.x;
      cdir.y = dir.y;

      return entity;
    };

    if(this.world === undefined){
      return;
    }

    if((randt(dt, 0.5) && context.app.ticker.lastTime - this.lastEnemyTime > 500) || 
       context.app.ticker.lastTime - this.lastEnemyTime > 2000){
      this.lastEnemyTime = context.app.ticker.lastTime;

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

      createEnemy(pos, dir);
    }
  }
}