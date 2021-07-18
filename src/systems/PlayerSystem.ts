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
import { ValueOf, rgba, flatSingle, rectMap } from '../libs/util/util';
import InputManager from '../input/InputManager';
import { Key } from 'ts-key-enum';
import { GraphNodeComponent } from '../components/GraphComponent';
import { SpriteComponent } from '../components/SpriteComponent';
import { Circle, Polygon } from '../libs/util/Shape';
import { DirectionComponent } from '../components/DirectionComponent';
import { LambdaComponent } from '../components/LambdaComponent';
import { GAME_HEIGHT, GAME_WIDTH, Colors, WALL_SIZE } from '../def';
import { Vector2Util } from '../libs/util/CollisionUtil';
import { changeEnemyType } from './LevelSystem';
import { GraphicsUtil } from '../libs/util/GraphicsUtil';
import { GeneratorComponent } from '../components/GeneratorComponent';

const key = InputManager.Instance.keyboard;
const pointer = InputManager.Instance.pointer;

const PlayerRadius = 11;
const PlayerRim = 4;
const MoveAreaWidthHalf = (GAME_WIDTH / 2) - WALL_SIZE - PlayerRadius;
const MoveAreaHeightHalf = (GAME_HEIGHT / 2) - WALL_SIZE - PlayerRadius;

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

const cwToEnemyType = (ccw: boolean) => {
  return ccw ? EnemyType.White : EnemyType.Blue;
}

const createPlayerTexture = () => {
  const w = PlayerRadius*2;
  const h = PlayerRadius*2;
  return PIXI.Texture.fromBuffer(Uint8Array.from(flatSingle(rectMap(w, h, (x,y) => {
    const r = Math.abs(x + 0.5 - w/2) + Math.abs(y + 0.5 - h/2);
    return PlayerRadius - PlayerRim <= r && r < PlayerRadius ? rgba(0xFFFFFFFF) : rgba(0);
   }))), w, h);
}
const playerTexture = createPlayerTexture();

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

  createPolyFlash = (context: GameContext, poly: Polygon, ccw: boolean) => {
    const entity = this.world.createEntity();
    const lifeTime = 10;
    const graphics = this.graphics;
    const baseColor = 0x00FFFFFF & (ccw ? Colors.WhiteEnemy : Colors.BlueEnemy);
    entity.addComponent(GeneratorComponent, function* (){
      for(let i = lifeTime; i > 0; i--) {
        let alpha = 0xFF & ~~(0xFF * i / lifeTime);
        GraphicsUtil.drawShape(graphics, poly, {}, 0, (alpha << 24) | baseColor, true);
        yield;
      }
      entity.destroy();
    });
  }

  createPlayer = (context: GameContext) => {
    const entity = this.world.createEntity();
    const cpos = entity.addComponent(PositionComponent);
    const cdir = entity.addComponent(DirectionComponent);
    entity.addComponent(PlayerComponent);
    const cmove = entity.addComponent(MoveComponent);
    const cnode = entity.addComponent(GraphNodeComponent, context.view.container, cpos.x, cpos.y, Layer.Entity, false);
    entity.addComponent(SpriteComponent, cnode.node, playerTexture);
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
      const changeDir = direction != toDirection(cdir);
      if(changeDir) {
        const d = dirToVec(direction);
        cdir.x = d.x;
        cdir.y = d.y;
        // マーカー追加
        points.push({pos: {x: cpos.x, y: cpos.y}});
      }

      // 移動
      const speed = 1.0;
      let mv = cmove.getMove();
      mv.x = cdir.x * speed;
      mv.y = cdir.y * speed;

      const enemies = this.world.getEntities([EnemyComponent]);
      const entries = [...points.slice(0, changeDir ? -2 : -1).entries()];
      for(let [i,e] of entries.reverse()) {
        // 囲い検出
        const p_i = points[i];
        const nearX = Math.abs(p_i.pos.x - cpos.x) < speed; // マーカーとxが同じ
        const nearY = Math.abs(p_i.pos.y - cpos.y) < speed; // マーカーとyが同じ
        if(i === entries.length - 1 ? (nearX && nearY) : (nearX || nearY)) {
          // 現在地も加えて計算
          const currentPos = { x: nearX ? p_i.pos.x : cpos.x, y: nearY ? p_i.pos.y : cpos.y }; // ズレ矯正
          const p = [...points.map(e=>e.pos), ...(changeDir ? [] : [currentPos])];
          // 回転方向
          const cross = 
            Vector2Util.cross2d(
              Vector2Util.sub(p[i], p[p.length-1]),
              Vector2Util.sub(p[p.length-2], p[p.length-1]));
          const ccw = cross > 0;
          // 四角形に分割
          const firstDir = Vector2Util.sub(p[i], p[i+1]);
          const firstVertical = Math.abs(firstDir.x) < Number.EPSILON;
          const polys: Polygon[] = [];
          for(let j = i + 1; j < p.length - 1; j++) {
            const poly = firstVertical ?
              [p[j], p[j+1], {x: p[i].x, y: p[j+1].y}, {x: p[i].x, y: p[j].y}] : 
              [p[j], p[j+1], {x: p[j+1].x, y: p[i].y}, {x: p[j].x, y: p[i].y}];  
            polys.push(new Polygon(ccw ? poly : poly.reverse()));
          }

          // ポリゴン描画
          this.createPolyFlash(context, new Polygon(p.slice(i)), ccw);

          // ポイント計算
          let up = 0;
          let down = 0;
          enemies.map(e => {
            const epos = e.getComponent(PositionComponent);
            const enemy = e.getComponent(EnemyComponent);
            const einfo = e.getComponent(CommonInfoComponent);
            for(let poly of polys) {
              // ヒットした
              if(epos !== undefined && enemy !== undefined && einfo !== undefined && enemy.enable && poly.hit(enemy.shape, {bPos: epos})){
                einfo.active = false;
                if(cwToEnemyType(ccw) == enemy.type) {
                  const num = (++up) * 10;
                  context.score += num;
                  this.createScore(context, `+${num}`, epos.x, epos.y);
                }
                else {
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
          
          // 直角を保ちたい
          points.splice(i > 0 && Math.abs(Vector2Util.sub(currentPos, p[i]).dot(Vector2Util.sub(p[i-1], p[i]))) < Number.EPSILON ? i + 1 : i);
          // 現在地にマーカーを付けて終わり
          if(!(nearX && nearY) || points.length == 0){
            points.push({pos: {x: currentPos.x, y: currentPos.y}});
          }
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