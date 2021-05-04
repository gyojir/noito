import * as PIXI from 'pixi.js';
import * as mugen from 'mu-gen';
import { System, World } from '../libs/ecs/ecs';
import * as Core from '../libs/core/core';
import { GameContext, Layer } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { CollideableComponent } from '../components/CollideableComponent';
import { EnemyComponent, EnemyType } from '../components/EnemyComponent';
import { CommonInfoComponent } from '../components/CommonInfoComponent';
import { MoveComponent } from '../components/MoveComponent';
import { clamp, ValueOf, rgbaF32, range } from '../libs/util/util';
import InputManager from '../input/InputManager';
import { Key } from 'ts-key-enum';
import { MassComponent } from '../components/MassComponent';
import { GraphNodeComponent } from '../components/GraphComponent';
import { SpriteComponent } from '../components/SpriteComponent';
import { PhysicsBodyComponent } from '../components/PhysicsBodyComponent';
import TextureLists from '../scenes/TextureList';
import { Circle, Polygon } from '../libs/util/Shape';
import { DirectionComponent } from '../components/DirectionComponent';
import { LambdaComponent } from '../components/LambdaComponent';
import { GAME_HEIGHT, GAME_WIDTH, Colors } from '../def';
import { Vector2Util } from '../libs/util/CollisionUtil';
import { changeEnemyType } from './LevelSystem';
import { flatten } from 'lodash';
import { GraphicsUtil } from '../libs/util/GraphicsUtil';

const key = InputManager.Instance.keyboard;
const pointer = InputManager.Instance.pointer;

export const MoveAreaWidthHalf = (GAME_WIDTH / 2) - 30;
export const MoveAreaHeightHalf = (GAME_HEIGHT / 2) - 30;

const Direction = {
  Left: 0,
  Right: 1,
  Up: 2,
  Down: 3,
};

const toDirection = (d: Core.Types.Math.Vector2Like) => {
  const dir = new Core.Math.Vector2(d);
  if(dir.x < 0) {
    return Direction.Left;
  }
  else if(dir.x > 0) {
    return Direction.Right;
  }
  else if(dir.y < 0) {
    return Direction.Up;
  }
  else if(dir.y > 0) {
    return Direction.Down;
  }
  throw new Error("invalid direction")
};

const dirToVec = (dir: ValueOf<typeof Direction>) => {
  if (dir == Direction.Left) {
    return {x:-1, y: 0};
  }
  else if(dir == Direction.Right) {
    return {x:1, y: 0};
  }
  else if(dir == Direction.Up) {
    return {x:0, y: -1};
  }
  else {
    return {x:0, y: 1};
  }
};


const createPlayerTexture = () => {
  const w = 32;
  const h = 32;
  const rim = 4;
  const radius = 7;
  return PIXI.Texture.fromBuffer(Float32Array.from(flatten(range(w).map((x) => flatten(range(h).map(y => {
    const r = Math.abs(x - w/2) + Math.abs(y - h/2);
    return radius <= r && r < radius + rim ? rgbaF32(0xFFFFFFFF) : rgbaF32(0);
   }))))), w, h);
}

export class PlayerSystem extends System<GameContext> {
  graphics = new PIXI.Graphics();
  constructor(world: World){
    super(world, [PlayerComponent, CollideableComponent]);
  }
  
  createScore = (context: GameContext, str: string, x: number, y: number) => {
    const entity = this.world.createEntity();
    const cpos = entity.addComponent(PositionComponent);
    const cnode = entity.addComponent(GraphNodeComponent, context.view.container, cpos.x, cpos.y, Layer.Entity);
    const cinfo = entity.addComponent(CommonInfoComponent, false);

    if(context.uiMain?.l7s124 === undefined) {
      return;
    }

    const text = new PIXI.BitmapText(str, {fontName: context.uiMain?.l7s124});
    text.anchor = 0.5;
    text.scale.x = 2;
    text.scale.y = 2;
    cnode.node.addChild(text);
    cpos.x = x;
    cpos.y = y;
    
    let i = 0;
    entity.addComponent(LambdaComponent, ()=> {
      i++;
      cpos.y -= 1;
      if(i > 30){
        cinfo.active = false;
      }
    }, ()=>{
      text.destroy();
    });
  }

  createPlayer = (context: GameContext) => {
    const entity = this.world.createEntity();
    const cpos = entity.addComponent(PositionComponent);
    const cdir = entity.addComponent(DirectionComponent);
    entity.addComponent(PlayerComponent);
    const cmove = entity.addComponent(MoveComponent);
    const cnode = entity.addComponent(GraphNodeComponent, context.view.container, cpos.x, cpos.y, Layer.Entity);
    entity.addComponent(SpriteComponent, cnode.node, createPlayerTexture());
    const info = entity.addComponent(CommonInfoComponent, false);

    let points: {pos: {x: number, y: number}}[] = [{pos: {x: cpos.x, y: cpos.y}}];
    entity.addComponent(LambdaComponent, ()=> {      
      const threas = 200;
      let direction = toDirection(cdir);
      if (key.isDown(Key.ArrowLeft) || (pointer.data.down && Math.abs(pointer.data.velocity.x) > Math.abs(pointer.data.velocity.y) && pointer.data.velocity.x > threas)) { direction = Direction.Left; }
      else if(key.isDown(Key.ArrowRight) || (pointer.data.down && Math.abs(pointer.data.velocity.x) > Math.abs(pointer.data.velocity.y) && pointer.data.velocity.x < -threas)) { direction = Direction.Right; }
      else if(key.isDown(Key.ArrowDown) || (pointer.data.down && Math.abs(pointer.data.velocity.x) < Math.abs(pointer.data.velocity.y) && pointer.data.velocity.y < -threas)) { direction = Direction.Down; }
      else if(key.isDown(Key.ArrowUp) || (pointer.data.down && Math.abs(pointer.data.velocity.x) < Math.abs(pointer.data.velocity.y) && pointer.data.velocity.y > threas)) { direction = Direction.Up; }

      {
        const enableDir: ValueOf<typeof Direction>[] = []
        if(cpos.x > -MoveAreaWidthHalf) { enableDir.push(Direction.Left); }
        if(cpos.x < MoveAreaWidthHalf) { enableDir.push(Direction.Right); }
        if(cpos.y > -MoveAreaHeightHalf) { enableDir.push(Direction.Up); }
        if(cpos.y < MoveAreaHeightHalf) { enableDir.push(Direction.Down); }
        if(!enableDir.includes(direction)){
          const priority =
            direction == Direction.Left   ?  {[Direction.Left]: 0, [Direction.Right]: 1, [Direction.Up]: 2, [Direction.Down]: 3} :
            direction == Direction.Right  ?  {[Direction.Left]: 1, [Direction.Right]: 0, [Direction.Up]: 3, [Direction.Down]: 2} :
            direction == Direction.Up     ?  {[Direction.Left]: 3, [Direction.Right]: 2, [Direction.Up]: 0, [Direction.Down]: 1} :
            /*direction == Direction.Down ?*/{[Direction.Left]: 2, [Direction.Right]: 3, [Direction.Up]: 1, [Direction.Down]: 0};
          enableDir.sort((a,b)=>priority[b] - priority[a]);
          direction = enableDir[0];
        }
      }

      // 方向変化
      if(direction != toDirection(cdir)) {
        const d = dirToVec(direction);
        cdir.x = d.x;
        cdir.y = d.y;
        points.push({pos: {x: cpos.x, y: cpos.y}});
      }

      // 移動
      const speed = 1;
      let mv = cmove.getMove();
      mv.x = cdir.x * speed;
      mv.y = cdir.y * speed;

      const enemies = this.world.getEntities([EnemyComponent]);
      for(let [i,e] of [...points.slice(0, -2).entries()].reverse()) {
        if(Vector2Util.sub(points[points.length-1].pos, cpos).lengthSq() > Number.EPSILON &&
           (Math.abs(points[i].pos.x - cpos.x) < Number.EPSILON ||
            Math.abs(points[i].pos.y - cpos.y) < Number.EPSILON)) {
          const p = [...points.map(e=>e.pos), cpos];
          const ccw =
            Vector2Util.cross2d(
              Vector2Util.sub(p[i], p[p.length-1]),
              Vector2Util.sub(p[p.length-2], p[p.length-1])) > 0;
          const firstDir = Vector2Util.sub(p[i], p[i+1]);
          const firstVertical = Math.abs(firstDir.x) < Number.EPSILON;
          const polys: Polygon[] = [];
          for(let j = i + 2; j < p.length - 1; j++) {
            const poly = firstVertical ?
              [p[j], p[j+1], {x: p[i].x, y: p[j+1].y}, {x: p[i].x, y: p[j].y}] : 
              [p[j], p[j+1], {x: p[j+1].x, y: p[i].y}, {x: p[j].x, y: p[i].y}];  
            polys.push(new Polygon(ccw ? poly : poly.reverse()));
          }
          polys.forEach(e=> GraphicsUtil.drawShape(this.graphics, e, {}, 0, ccw ? Colors.WhiteEnemy : Colors.BlueEnemy, true));
          let up = 0;
          let down = 0;
          enemies.map(e => {
            const epos = e.getComponent(PositionComponent);
            const enemy = e.getComponent(EnemyComponent);
            const einfo = e.getComponent(CommonInfoComponent);
            for(let poly of polys) {
              if(epos !== undefined && enemy != undefined && einfo !== undefined && enemy.enable && poly.hit(enemy.shape, {bPos: epos})){
                einfo.active = false;
                const score =
                  enemy.type === EnemyType.White ? (ccw ? 1 : -1) :
                  enemy.type === EnemyType.Blue ? (ccw ? -1 : 1) : 0;
                if(score > 0) {
                  const num = (++up) * 10;
                  context.score += num;
                  this.createScore(context, `+${num}`, epos.x, epos.y);
                }
                else if(score < 0){
                  info.active = false;
                }
                if(enemy.type === EnemyType.Death) {
                  info.active = false;
                }
                break;
              }
            }
          });
          if(info.active === false) { mugen.playSE(mugen.Presets.Explosion); }
          else if(up > 0 && up >= down) { mugen.playSE(mugen.Presets.Coin); }
          else if(down > 0) { mugen.playSE(mugen.Presets.Hit); }
          if(up >= 5 && down === 0){
            enemies.map(e => changeEnemyType(e, ccw ? EnemyType.White : EnemyType.Blue));
          }
          
          points.splice(i > 0 && Math.abs(Vector2Util.sub(cpos, p[i]).dot(Vector2Util.sub(p[i-1], p[i]))) < Number.EPSILON ? i + 1 : i);
          points.push({pos: {x: cpos.x, y: cpos.y}});
          break;
        }
      }
      points.forEach((e,i) => {
        GraphicsUtil.drawShape(this.graphics, new Circle(5), e.pos, 0);
        GraphicsUtil.drawShape(this.graphics, new Polygon([e.pos, (i < points.length - 1) ? points[i+1].pos : cpos]), {}, 0);
      });

      oldDir.x = cdir.x;
      oldDir.y = cdir.y;
    });

    cpos.x = 0;
    cpos.y = 0;
    cdir.x = 0;
    cdir.y = 1;
    cmove.areaWidth = MoveAreaWidthHalf * 2;
    cmove.areaHeight = MoveAreaHeightHalf * 2;
    let oldDir = {x: cdir.x, y: cdir.y};

    return entity;
  };
  
  preUpdate(dt: number, context: GameContext){
    GraphicsUtil.clear(this.graphics);
  }
  
  update(dt: number, context: GameContext){
    if(this.graphics.parent === null) {
      context.view.container.addChild(this.graphics);
      this.graphics.zIndex = Layer.Front;
    }

    this.forEach(e=>{
      const coll = e.getComponent(CollideableComponent);
      const info = e.getComponent(CommonInfoComponent);

      if(coll === undefined ||
         info === undefined){
        return;
      }
    })
  }
}