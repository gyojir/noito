import * as PIXI from 'pixi.js'
import * as ImGui from 'imgui-js/imgui.js';
import { StateMachine, StateType, StateMachineBase } from '../libs/core/StateMachine';
import { beginImGui, endImGui, clearImGui } from '../libs/util/util';
import InputManager from '../input/InputManager';
import { View } from '../libs/view/View';

export type StateMachineConfig = {
  getMachine: () => StateMachineBase | undefined;
}

/**
 * ステートマシン
 * updateはsceneのupdateから呼ぶこと
 */
export abstract class SceneStateMachine<T extends StateType> extends StateMachine<T>{
  enableDebug: boolean = false;
  app: PIXI.Application;
  view: View;

  constructor(config: { app: PIXI.Application, state?: keyof T}){
    super(config.state);
    this.app = config.app;
    this.view = new View(this.app.screen.width, this.app.screen.height);
    this.app.stage.addChild(this.view.renderSprite);
    this.app.stage.addChild(this.view.debugOffsetContainer);
  }

  // 破棄処理
  // 必ず呼びたいのでreadonly
  // オーバーライドしたい場合はonDestroyOverrideを使う
  readonly onDestroy = () => {
    this.onDestroyOverride();
  }

  onDestroyOverride() {
  }

  readonly onUpdateCalled = () => {
    this.onUpdateCalledOverride();

    this.view.render(this.app.renderer);
  }
   
  onUpdateCalledOverride() {

  }

  // デバッグ描画開始
  // 描画コンテキスト内で呼ぶこと
  readonly entryDebugDraw = (time: number): void => {
    if(process.env.NODE_ENV === "development"){
      const key = InputManager.Instance.keyboard;
      if(key.isTriggered("d")){
        this.enableDebug = !this.enableDebug;
        clearImGui();
      }
      if(this.enableDebug){
        beginImGui(time);
        ImGui.Begin("Debug Window");
    
        this.debugDrawRecursive();

        ImGui.End();
        endImGui();
      }
    }
  }
}