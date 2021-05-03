import * as PIXI from 'pixi.js';
import * as PIXIFilters from 'pixi-filters';
import * as ImGui from 'imgui-js/imgui.js';
import * as mugen from 'mu-gen';
import * as ecs from '../libs/ecs/ecs';
import * as Core from '../libs/core/core';
import { PositionComponent } from '../components/PositionComponent';
import { SpriteComponent } from '../components/SpriteComponent';
import { EnemyComponent } from '../components/EnemyComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { PhysicsBodyComponent } from '../components/PhysicsBodyComponent';
import { CommonInfoComponent } from '../components/CommonInfoComponent';
import { MoveComponent } from '../components/MoveComponent';
import { DirectionComponent } from '../components/DirectionComponent';
import { BulletComponent, BulletType } from '../components/BulletComponent';
import { MoveSystem } from '../systems/MoveSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { LevelSystem } from '../systems/LevelSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { DestroySystem } from '../systems/DestroySystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { BulletSystem } from '../systems/BulletSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { MoveRestrictComponent } from '../components/MoveRestrictComponent';
import { MassComponent } from '../components/MassComponent';
import { SceneStateMachine } from './SceneStateMachine';
import { CollideableComponent } from '../components/CollideableComponent';
import { Circle, Box, Polygon } from '../libs/util/Shape';
import { getAngle, Constructor } from '../libs/util/util';
import { GeneratorComponent } from '../components/GeneratorComponent';
import { GeneratorSystem } from '../systems/GeneratorSystem';
import { LambdaComponent } from '../components/LambdaComponent';
import { LambdaSystem } from '../systems/LambdaSystem';
import TextureList, { toTexParams } from './TextureList';
import { DebugDraw } from './DebugDraw';
import { View } from '../libs/view/View';
import { ParticleComponent } from '../components/ParticleComponent';
import { ParticleSystem } from '../systems/ParticleSystem';
import * as Package1 from '../exportedUI/Package1/Package1Binder';
import InputManager from '../input/InputManager';
import { Key } from 'ts-key-enum';
import { GraphNodeComponent } from '../components/GraphComponent';
import TextureLists from './TextureList';

const key = InputManager.Instance.keyboard;
const pointer = InputManager.Instance.pointer;

export const Layer = {
  Background_0: 0,
  Background_1: 1,
  Entity: 2,
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


export interface GameContext {
  app: PIXI.Application;
  loader: PIXI.Loader;
  view: View;
  score: number;
  createBullet: (pos: Core.Types.Math.Vector2Like, dir: Core.Types.Math.Vector2Like, speed: number, type: BulletType) => ecs.Entity;
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

  world = new ecs.World();
  loader = new PIXI.Loader();
  ui?: Package1.Package1Binder;
  uiMain?: Package1.UI_Main;
  context: GameContext = {
    app: this.app,
    loader: this.loader,
    view: this.view,
    score: 0,
    createBullet: (pos: Core.Math.Vector2, dir: Core.Math.Vector2, speed: number, type: BulletType) => {
      let entity = this.world.createEntity();
      let cpos = entity.addComponent(PositionComponent);
      let cmov = entity.addComponent(MoveComponent);
      let cdir = entity.addComponent(DirectionComponent);
      entity.addComponent(BulletComponent, type);
      entity.addComponent(CollideableComponent, new Box(10, 30));
      let cnode = entity.addComponent(GraphNodeComponent, this.view.container, pos.x, pos.y, Layer.Entity);
      entity.addComponent(SpriteComponent, cnode.node, this.loader.resources[TextureList.Bullet.key].texture);
      entity.addComponent(CommonInfoComponent);
      entity.addComponent(LambdaComponent, (dt, context) => {
        let mv = cmov.getMove("move");
        mv.x = cdir.x * speed;
        mv.y = cdir.y * speed;
      });

      cpos.x = pos.x;
      cpos.y = pos.y;
      cdir.x = dir.x;
      cdir.y = dir.y;

      return entity;
    },
  };
  
  createPlayer = () => {
    let entity = this.world.createEntity();
    let cpos = entity.addComponent(PositionComponent);
    entity.addComponent(PlayerComponent);
    entity.addComponent(MassComponent);
    entity.addComponent(MoveComponent);
    let cnode = entity.addComponent(GraphNodeComponent, this.view.container, cpos.x, cpos.y, Layer.Entity);
    entity.addComponent(SpriteComponent, cnode.node, this.loader.resources[TextureLists.Entity.key].texture);
    entity.addComponent(PhysicsBodyComponent, 15);
    entity.addComponent(CollideableComponent, new Circle(15));
    entity.addComponent(CommonInfoComponent, false);
    const particle = entity.addComponent(ParticleComponent,
      this.view.container,
      [this.loader.resources[TextureLists.Entity.key].texture],
      {
        alpha: {
          list: [
            { value: 0.5, time: 0 },
            { value: 0.0, time: 1 }
          ],
          isStepped: false
        },
        scale: {
          list: [
            { value: 1, time: 0 },
            { value: 0.9, time: 1 }
          ],
          isStepped: false
        },
        speed: {
          list: [
            { value: 0, time: 0 },
            // { value: 100, time: 1 }
          ],
          isStepped: false
        },
        // startRotation: { min: 0, max: 360 },
        // rotationSpeed: { min: 0, max: 0 },
        lifetime: { min: 0.05, max: 0.05 },
        frequency: 0.005,
        spawnChance: 1,
        particlesPerWave: 1,
        // emitterLifetime: 0.1,
        maxParticles: 100,
        pos: { x: 0, y: 0 },
        addAtBack: false,
        spawnType: "point",
        emit: true
      },
      (delta) => {
        particle.emitter.spawnPos.x = cpos.x;
        particle.emitter.spawnPos.y = cpos.y;
        particle.emitter.update(delta);
      });


    cpos.x = 0;
    cpos.y = 0;

    return entity;
  };
  
  createPlatform = (pos: Core.Math.Vector2, lines: Core.Curves.Line[]) => {
    let entity = this.world.createEntity();
    let cpos = entity.addComponent(PositionComponent);
    let cplatform = entity.addComponent(MoveRestrictComponent);
    entity.addComponent(CommonInfoComponent, false);

    // 仮描画
    const lineGraph = lines.map(l => {
      const graph = new Line(l.p0, l.p1, 1, 0xffffff);
      this.view.container.addChild(graph);
      return graph;
    });

    cpos.x = pos.x;
    cpos.y = pos.y;
    cplatform.lines = lines;

    return entity;
  };

  constructor(app: PIXI.Application) {
    super({ app });
    this.view.container.interactive = true;

    // ブラーフィルター作成
    let blur = new PIXI.filters.BlurFilter();
    let glitch = new PIXIFilters.GlitchFilter();
    let abloom = new PIXIFilters.AdvancedBloomFilter({
      threshold: 0.3,
      bloomScale: 1.5,
      brightness: 1.5,
      blur: 0.1,
      quality: 20
    });
    let bloom = new PIXIFilters.BloomFilter(3);
    this.view.renderSprite.filters = [bloom];

    //--------------------------------------------------
    // ステート関数
    //--------------------------------------------------

    this.enterFunc.Load = () => {

      this.loader
        .add(...toTexParams(TextureList.Entity))
        .add(...toTexParams(TextureList.Bullet))
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
      this.uiMain._n2.component.on("buttonDown", (...a: any) => {
        this.uiMain?._t0.restart();
        // this.uiMain?._t0.play();
      })
      app.stage.addChild(this.uiMain.component);

      // System登録
      this.world.addSystem(LevelSystem);
      this.world.addSystem(GeneratorSystem);
      this.world.addSystem(LambdaSystem);
      this.world.addSystem(EnemySystem);
      this.world.addSystem(PlayerSystem);
      this.world.addSystem(DestroySystem);
      this.world.addSystem(CollisionSystem);
      this.world.addSystem(BulletSystem);
      this.world.addSystem(PhysicsSystem);
      this.world.addSystem(MoveSystem);
      this.world.addSystem(ParticleSystem);
      this.world.addSystem(RenderSystem, this.context.view);

      this.createPlatform(new Core.Math.Vector2(), [
        new Core.Curves.Line([220, 230, -200, 150]),
        new Core.Curves.Line([320, -130, -200, -150]),
      ]);
    }

    this.updateFunc.Wait = () => {
      this.world.update(this.app.ticker.deltaMS, this.context);
      
      if(this.world.getEntities([PlayerComponent]).length === 0 &&
        (pointer.data.justUp || key.isTriggered(" "))){
        this.context.score = 0;
        this.createPlayer();
        this.nextState = MainScene.State.Main;
      }
    }

    this.enterFunc.Main = () => {
      mugen.playBGM("0");
      
      if(this.uiMain) {
        this.uiMain._n4.visible = true;
        this.uiMain._n5.visible = false;
      }
    }
    
    this.updateFunc.Main = () => {
      this.world.update(this.app.ticker.deltaMS, this.context);
      this.uiMain && (this.uiMain._n4.text = `score ${this.context.score}`);

      // プレイヤー追尾
      const player = this.world.getEntities([PlayerComponent])
      player.forEach(e => {
        // スクリーン中心原点の座標
        const pos = new Core.Math.Vector2(e.getComponent(PositionComponent)?.getScreenPos(this.context.view.camera));

        const DEAD_ZONE_HALF_WIDTH = 50;
        const DEAD_ZONE_HALF_HEIGHT = 50;
        if (Math.abs(pos.x) > DEAD_ZONE_HALF_WIDTH) {
          this.context.view.camera.pos.x += (Math.abs(pos.x) - DEAD_ZONE_HALF_WIDTH) * Math.sign(pos.x);
        }
        if (Math.abs(pos.y) > DEAD_ZONE_HALF_HEIGHT) {
          this.context.view.camera.pos.y += (Math.abs(pos.y) - DEAD_ZONE_HALF_HEIGHT) * Math.sign(pos.y);
        }
      });

      if(player.length === 0){
        this.nextState = MainScene.State.Wait;
      }
    }

    this.leaveFunc.Main = () => {
      mugen.stopBGM("0");
    }
  }

  debugDraw() {
    if (true) {
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
        }
      });
    }
  }

  onDestroyOverride() {
    this.uiMain?.component.destroy();
  }

  onUpdateCalledOverride() {
    this.context.view.update()
  }

}
export const createMainScene = (app: PIXI.Application) => () => new MainScene(app);