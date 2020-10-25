import * as PIXI from 'pixi.js'
import { SceneStateMachine } from './SceneStateMachine';
import { createMainRoot } from './MainScene';
import { DebugDraw } from './DebugDraw';
import * as ImGui from 'imgui-js/imgui.js';

/**
 * GameRoot
 */
class GameRoot extends SceneStateMachine<typeof GameRoot.State>{
  static State = {
    Init: "Init",
    Main: "Main"
  } as const;

  mainRootId: number;

  constructor(app: PIXI.Application){
    super({app, state: GameRoot.State.Init});
    this.mainRootId = this.addChild(GameRoot.State.Main, createMainRoot(app));
        
    // デバッグ描画用
    this.app.stage.addChild(DebugDraw.Instance.defaultGraphics);

    //--------------------------------------------------
    // ステート関数
    //--------------------------------------------------

    this.enterFunc.Init = () => {
      this.nextState = GameRoot.State.Main;
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
  }

  onUpdateCalledOverride(){
    DebugDraw.Instance.clear();
    this.entryDebugDraw(this.app.ticker.lastTime);
  }
}
export const createGameRoot = (app: PIXI.Application) => new GameRoot(app);