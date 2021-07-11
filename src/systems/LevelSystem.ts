import * as PIXI from 'pixi.js';
import { System } from '../libs/ecs/ecs';
import * as Core from '../libs/core/core';
import { selectRand, randf, ValueOf, randt, range, randWeight, rgba, flatSingle, rectMap } from '../libs/util/util';
import { GameContext, Layer } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { EnemyComponent, EnemyType } from '../components/EnemyComponent';
import { CommonInfoComponent } from '../components/CommonInfoComponent';
import { Circle, Box } from '../libs/util/Shape';
import { GraphNodeComponent } from '../components/GraphComponent';
import { SpriteComponent } from '../components/SpriteComponent';
import { GeneratorComponent } from '../components/GeneratorComponent';
import { GAME_WIDTH, GAME_HEIGHT, Colors } from '../def';
import { Entity } from '../libs/ecs/Entity';
import { World } from '../libs/ecs/World';

const SpawnAreaWidthHalf = (GAME_WIDTH / 2) - 30;
const SpawnAreaHeightHalf = (GAME_HEIGHT / 2) - 30;

const createEnemyTexture = (type: ValueOf<typeof EnemyType>) => {
  const w = 15;
  const color = rgba(
    type === EnemyType.White ? Colors.WhiteEnemy :
    type === EnemyType.Blue ? Colors.BlueEnemy : 0);
  const counter_color = color.map((c,i) => i===3 ? c : ~~(c * 0.65));    
  return PIXI.Texture.fromBuffer(Uint8Array.from(flatSingle(rectMap(w,w, (x,y) => {
    x += 0.5 - w/2;
    y += 0.5 - w/2;
    [x,y] =  Math.sign(x) + Math.sign(y) == 0 ? [y,x] : [x,y];  // 4つの象限を重ねる
    [x,y] = [-Math.abs(x) + w/2, -Math.abs(y) + w/2];           // 辺の内側にくっつける
    [x,y] = type === EnemyType.White ? [y,x] : [x,y];           // 色ごとの向き
    return (x < (w/2.5) && x * 0.4 > y) ? counter_color : color;
  }))), w, w);
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
        // 出現前点滅
        for (let i = 0, time = context.app.ticker.lastTime; context.app.ticker.lastTime - time < 2000; i++) {
          csprite.sprite.visible = (i/2) % 2 == 0;
          yield;
        }
        // 出現
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
       context.app.ticker.lastTime - this.lastEnemyTime > 1500){
      this.lastEnemyTime = context.app.ticker.lastTime;
      createEnemy({x: randf(-SpawnAreaWidthHalf, SpawnAreaWidthHalf), y: randf(-SpawnAreaHeightHalf, SpawnAreaHeightHalf)}, Object.values(EnemyType)[randWeight([0.5,0.5])]);
    }
  }
}