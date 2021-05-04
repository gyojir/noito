import * as PIXI from 'pixi.js';
import { System } from '../libs/ecs/ecs';
import * as Core from '../libs/core/core';
import { selectRand, randf, ValueOf, randt, range, rgbaF32, randWeight } from '../libs/util/util';
import { GameContext, Layer } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { EnemyComponent, EnemyType } from '../components/EnemyComponent';
import { CommonInfoComponent } from '../components/CommonInfoComponent';
import { Circle, Box } from '../libs/util/Shape';
import { GraphNodeComponent } from '../components/GraphComponent';
import { SpriteComponent } from '../components/SpriteComponent';
import { GeneratorComponent } from '../components/GeneratorComponent';
import { flatten } from 'lodash';
import { GAME_WIDTH, GAME_HEIGHT, Colors } from '../def';
import { Entity } from '../libs/ecs/Entity';
import { World } from '../libs/ecs/World';

const SpawnAreaWidthHalf = (GAME_WIDTH / 2) - 30;
const SpawnAreaHeightHalf = (GAME_HEIGHT / 2) - 30;

const createEnemyTexture = (type: ValueOf<typeof EnemyType>) => {
  const w = 16;
  const h = 16;
  const color =
    type === EnemyType.White ? Colors.WhiteEnemy :
    type === EnemyType.Blue ? Colors.BlueEnemy : Colors.RedEnemy;
  return PIXI.Texture.fromBuffer(Float32Array.from(flatten(range(w*h).map(() => rgbaF32(color)))), w, h);
}

const getEnemyTexture = {
  [EnemyType.White]: createEnemyTexture(EnemyType.White),
  [EnemyType.Blue]: createEnemyTexture(EnemyType.Blue),
  [EnemyType.Death]: createEnemyTexture(EnemyType.Death),
};

export const changeEnemyType = (entity: Entity, type: ValueOf<typeof EnemyType>) => {
  const enemy = entity.getComponent(EnemyComponent);
  const esprite = entity.getComponent(SpriteComponent);
  if(enemy !== undefined && esprite !== undefined) {
    enemy.type = type;
    esprite.sprite.texture = getEnemyTexture[enemy.type];
  }
};

export class LevelSystem extends System<GameContext> {
  lastEnemyTime = 0;
  constructor(world: World){
    super(world, []);
  }

  update(dt: number, context: GameContext){
    const createEnemy = (pos: Core.Types.Math.Vector2Like, type: ValueOf<typeof EnemyType>) => {
      let entity = this.world.createEntity();
      let cpos = entity.addComponent(PositionComponent);
      let cenemy = entity.addComponent(EnemyComponent, new Box(16,16), type);
      let cinfo = entity.addComponent(CommonInfoComponent);
      let cnode = entity.addComponent(GraphNodeComponent, context.view.container, pos.x || 0, pos.y || 0, Layer.Entity);
      let csprite = entity.addComponent(SpriteComponent, cnode.node, getEnemyTexture[type]);

      entity.addComponent(GeneratorComponent, function* (){
        for (let i = 0, time = context.app.ticker.lastTime; context.app.ticker.lastTime - time < 2000; i++) {
          csprite.sprite.visible = (i/2) % 2 == 0;
          yield;
        }
        csprite.sprite.visible = true;
        cenemy.enable = true;
        let beforeType = cenemy.type;
        const lifeTime = () => cenemy.type == EnemyType.Death ? 10000 : 30000;
        const FadeTime = 5000;
        for (let i = 0, time = context.app.ticker.lastTime; context.app.ticker.lastTime - time < lifeTime(); i++) {
          csprite.sprite.alpha = ((context.app.ticker.lastTime - time) - (lifeTime()-FadeTime)) * (-0.5 / FadeTime) + 1;
          if(beforeType !== cenemy.type) {
            time = context.app.ticker.lastTime;
            beforeType = cenemy.type;
          }
          yield;
        }
        cinfo.active = false;
      });

      cpos.x = pos.x || 0;
      cpos.y = pos.y || 0;

      return entity;
    };

    if((randt(dt, 5000) && context.app.ticker.lastTime - this.lastEnemyTime > 1500) || 
       context.app.ticker.lastTime - this.lastEnemyTime > 3000){
      this.lastEnemyTime = context.app.ticker.lastTime;
      createEnemy({x: randf(-SpawnAreaWidthHalf, SpawnAreaWidthHalf), y: randf(-SpawnAreaHeightHalf, SpawnAreaHeightHalf)}, Object.values(EnemyType)[randWeight([0.4,0.4,0.2])]);
    }
  }
}