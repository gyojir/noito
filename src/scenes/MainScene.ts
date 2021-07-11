import * as PIXI from 'pixi.js';
import * as PIXIFilters from 'pixi-filters';
import * as ImGui from 'imgui-js/imgui.js';
import * as mugen from 'mu-gen';
import * as ecs from '../libs/ecs/ecs';
import * as Core from '../libs/core/core';
import { PositionComponent } from '../components/PositionComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { DirectionComponent } from '../components/DirectionComponent';
import { MoveSystem } from '../systems/MoveSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { LevelSystem } from '../systems/LevelSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { DestroySystem } from '../systems/DestroySystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { SceneStateMachine } from './SceneStateMachine';
import { CollideableComponent } from '../components/CollideableComponent';
import { getAngle, rgbaU32, rgba, rectMap, flatSingle } from '../libs/util/util';
import { GeneratorSystem } from '../systems/GeneratorSystem';
import { LambdaSystem } from '../systems/LambdaSystem';
import { DebugDraw } from './DebugDraw';
import { View } from '../libs/view/View';
import { ParticleSystem } from '../systems/ParticleSystem';
import * as Package1 from '../exportedUI/Package1/Package1Binder';
import InputManager from '../input/InputManager';
import { GAME_HEIGHT, GAME_WIDTH, Colors, WALL_SIZE } from '../def';

const key = InputManager.Instance.keyboard;
const pointer = InputManager.Instance.pointer;

const AreaWidthHalf = (GAME_WIDTH / 2) - WALL_SIZE;
const AreaHeightHalf = (GAME_HEIGHT / 2) - WALL_SIZE;

export const Layer = {
  Background_0: 0,
  Background_1: 1,
  Entity: 2,
  Front: 3,
}

enum ShotPattern {
  OneWay,
  TwoWay,
  ThreeWay,
  FourWay
}

class Line extends PIXI.Graphics {
  lineWidth: number;
  lineColor: number;
  constructor(p0: Core.Types.Math.Vector2Like, p1: Core.Types.Math.Vector2Like, lineWidth?: number, lineColor?: number) {
    super();

    this.lineWidth = lineWidth || 5;
    this.lineColor = lineColor || 0x000000;
    this.lineStyle(this.lineWidth, this.lineColor);

    this.moveTo(p0.x || 0, p0.y || 0);
    this.lineTo(p1.x || 0, p1.y || 0);
  }

  updatePoints(p0: Core.Types.Math.Vector2Like, p1: Core.Types.Math.Vector2Like) {
    this.clear();
    this.lineStyle(this.lineWidth, this.lineColor);
    this.moveTo(p0.x || 0, p0.y || 0);
    this.lineTo(p1.x || 0, p1.y || 0);
  }
}

const createWallTexture = (color: number = Colors.Wall) => {
  const w = GAME_WIDTH;
  const h = GAME_HEIGHT;
  return PIXI.Texture.fromBuffer(Uint8Array.from(flatSingle(rectMap(w, h, (x,y) => {
    x += 0.5 - w/2;
    y += 0.5 - h/2;
    return x < -AreaWidthHalf || AreaWidthHalf < x ||
           y < -AreaHeightHalf || AreaHeightHalf < y ? rgba(color) : rgba(0);
   }))), w, h);
}


export interface GameContext {
  app: PIXI.Application;
  loader: PIXI.Loader;
  view: View;
  score: number;
  hiscore: number;
  uiMain?: Package1.UI_Main;
}

/**
 * MainScene
 */
class MainScene extends SceneStateMachine<typeof MainScene.State>{
  static State = {
    Load: "Load",
    Wait: "Wait",
    Main: "Main"
  } as const;

  enableDebug = true;
  world = new ecs.World();
  loader = new PIXI.Loader();
  ui?: Package1.Package1Binder;
  uiMain?: Package1.UI_Main;
  playserSystem: PlayerSystem | undefined;
  wall = new PIXI.Sprite(createWallTexture());
  context: GameContext = {
    app: this.app,
    loader: this.loader,
    view: this.view,
    score: 0,
    hiscore: 0,
    uiMain: undefined,
  };

  constructor(app: PIXI.Application) {
    super({ app });
    this.view.container.interactive = true;

    // ブラーフィルター作成
    let bloom = new PIXIFilters.BloomFilter(3);
    this.view.renderSprite.filters = [bloom];

    this.wall.anchor.x = 0.5;
    this.wall.anchor.y = 0.5;
    this.view.container.addChild(this.wall);

    //--------------------------------------------------
    // ステート関数
    //--------------------------------------------------

    this.enterFunc.Load = () => {
      this.loader
        .add("Package1@atlas0.png", "assets/UI/Package1@atlas0.png")
        .add("Package1.fui", "assets/UI/Package1.fui", { xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BUFFER })
        .load((loader, resources) => {
          this.nextState = MainScene.State.Wait;
        });
    };
    
    this.leaveFunc.Load = () => {
      // fgui
      this.ui = new Package1.Package1Binder(this);
      this.uiMain = this.ui.createUI_Main();
      this.context.uiMain = this.uiMain;
      app.stage.addChild(this.uiMain.component);

      // System登録
      this.world.addSystem(LevelSystem);
      this.world.addSystem(GeneratorSystem);
      this.world.addSystem(LambdaSystem);
      this.world.addSystem(EnemySystem);
      this.playserSystem = this.world.addSystem(PlayerSystem);
      this.world.addSystem(DestroySystem);
      this.world.addSystem(CollisionSystem);
      this.world.addSystem(MoveSystem);
      this.world.addSystem(ParticleSystem);
      this.world.addSystem(RenderSystem, this.context.view);
    }

    this.updateFunc.Wait = () => {
      this.world.update(this.app.ticker.deltaMS, this.context);
      
      if(this.world.getEntities([PlayerComponent]).length === 0 &&
        (pointer.data.justUp || key.isTriggered(" "))){
        this.context.score = 0;
        this.playserSystem?.createPlayer(this.context);
        this.nextState = MainScene.State.Main;
      }
    }

    this.enterFunc.Main = () => {
      mugen.playBGM("0");
      
      if(this.uiMain) {
        this.uiMain._n4.visible = true;
        this.uiMain._n8.visible = true;
        this.uiMain._n5.visible = false;
      }      
    }
    
    this.updateFunc.Main = () => {
      this.world.update(this.app.ticker.deltaMS, this.context);

      const player = this.world.getEntities([PlayerComponent])
      if(player.length === 0){
        this.context.hiscore = Math.max(this.context.score, this.context.hiscore);
        this.nextState = MainScene.State.Wait;
      }
    }

    this.leaveFunc.Main = () => {
      mugen.stopBGM("0");
    }
  }

  debugColor = {r: 0, g: 0, b: 0, a: 1};
  debugDraw() {
    if (true) {
      ImGui.LabelText("pointer", `${Math.floor(pointer.data.position.x)},${Math.floor(pointer.data.position.y)}`);
      ImGui.LabelText("velocity", `${Math.floor(pointer.data.velocity.x)},${Math.floor(pointer.data.velocity.y)}`);

      this.world.getEntities([PlayerComponent]).forEach(e => {
        const pos = e.getComponent(PositionComponent);
        ImGui.LabelText("pos", `${Math.floor(pos?.x || 0)},${Math.floor(pos?.y || 0)}`);
      });

      this.view.renderSprite.filters.map((e, i) => {
        if (ImGui.TreeNode(`filter[${i}]`)) {
          ImGui.Checkbox("enable", (value = e.enabled) => e.enabled = value);
          if (e instanceof PIXIFilters.AdvancedBloomFilter) {
            ImGui.SliderFloat("brightness", (value = e.brightness) => e.brightness = value, 0, 10);
            ImGui.SliderFloat("threshold", (value = e.threshold) => e.threshold = value, 0, 10);
            ImGui.SliderFloat("bloomScale", (value = e.bloomScale) => e.bloomScale = value, 0, 10);
            ImGui.SliderFloat("blur", (value = e.blur) => e.blur = value, 0, 10);
          }
          ImGui.TreePop();
        }
      });

      if(ImGui.ColorPicker3("wall", this.debugColor)){
        this.wall.texture = createWallTexture(rgbaU32(this.debugColor));
      }
      
      // コリジョン表示
      this.world.getEntities([
        CollideableComponent,
        PositionComponent
      ]).map(e => {
        const pos = e.getComponent(PositionComponent);
        const coll = e.getComponent(CollideableComponent);
        const dir = e.getComponent(DirectionComponent); // optional
        if (pos === undefined ||
          coll === undefined ||
          this.context.view === undefined) {
          return;
        }

        DebugDraw.Instance.drawShape(coll.shape, pos, getAngle(dir), this.view);
        DebugDraw.Instance.drawShape(coll.shape.getAABB(getAngle(dir)), pos, 0, this.view);
      });
    }
  }

  onDestroyOverride() {
    this.uiMain?.component.destroy();
  }

  onUpdateCalledOverride() {
    this.uiMain && (this.uiMain._n4.text = `HI ${this.context.hiscore}`);
    this.uiMain && (this.uiMain._n8.text = `${this.context.score}`);
    this.context.view.update();
  }

}
export const createMainScene = (app: PIXI.Application) => () => new MainScene(app);