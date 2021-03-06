import * as PIXI from 'pixi.js'
import { SceneStateMachine } from './SceneStateMachine';
import { createMainScene } from './MainScene';
import { DebugDraw } from './DebugDraw';
import * as ImGui from 'imgui-js/imgui.js';

/**
 * GameRoot
 */
class AppRoot extends SceneStateMachine<typeof AppRoot.State>{
  static State = {
    Init: "Init",
    Main: "Main"
  } as const;

  mainSceneId: number;

  constructor(app: PIXI.Application){
    super({app, state: AppRoot.State.Init});
    this.mainSceneId = this.addChild(AppRoot.State.Main, createMainScene(app));
        
    // デバッグ描画用
    this.app.stage.addChild(DebugDraw.Instance.defaultGraphics);

    //--------------------------------------------------
    // ステート関数
    //--------------------------------------------------

    this.enterFunc.Init = () => {
      this.nextState = AppRoot.State.Main;
    };
    
    this.updateFunc.Main = () => {
    };
    this.leaveFunc.Main = () => {
    };
  }

  debugDraw() {
    // ゲーム終了
    if(ImGui.Button("destroy")) {
      this.exitCode = 0;
    }
    
    // ゲーム終了
    if(ImGui.Button("reload")) {
      this.nextState = AppRoot.State.Init;
    }
    
    ImGui.LabelText("fps", `${Math.floor(1000 / this.app.ticker.deltaMS)}`);

  }

  onUpdateCalledOverride(){
    this.entryDebugDraw(this.app.ticker.lastTime);
  }
}
export const createGameRoot = (app: PIXI.Application) => new AppRoot(app);