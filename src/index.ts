import * as PIXI from 'pixi.js'
import * as mugen from 'mu-gen';
import { initImGui, clearImGui, Constructor } from './libs/util/util';
import './scenes/AppRoot';
import './libs/util/Shape'
import { GAME_WIDTH, GAME_HEIGHT } from './def';
import { createGameRoot } from './scenes/AppRoot';
import InputManager from './input/InputManager';
import * as ImGui_Impl from 'imgui-js/example/imgui_impl.js';

// サウンドシード
mugen.setSeed(3655865);

// 実行
window.onload = async ()=>{
  const debugCanvas = document.createElement("canvas");
  debugCanvas.width = window.innerWidth;
  debugCanvas.height = window.innerHeight;
  debugCanvas.style.position = "absolute";
  debugCanvas.style.width = "100%";
  debugCanvas.style.height = "100%";
  document.body.appendChild(debugCanvas);
  await initImGui(debugCanvas);

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const app = new PIXI.Application({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    view: canvas,
    backgroundColor: 0x444444,
    transparent: false
  });
  const root = createGameRoot(app);
  // app.renderer.plugins.interaction.autoPreventDefault = false;
  

  // 重なり部分のイベント
  [
    'pointerdown',
    'pointerover',
    'pointerup',
    'pointermove',
    'pointerout',
    'pointerupoutside'
  ].forEach(e=> debugCanvas.addEventListener(e,  (ev:any) => canvas.dispatchEvent(new ev.constructor(ev.type, ev))));
  
  // 起動
  app.ticker.minFPS = 60;
  app.ticker.add((delta) => {
    InputManager.Instance.update(app.ticker.deltaMS);
    root.update();
    InputManager.Instance.postUpdate();
    
    if(root.exitCode !== undefined && root.exitCode >= 0){
      root.destroy();
      app.ticker.stop();
      app.destroy(true);
      clearImGui();
      ImGui_Impl.Shutdown();
    }
  });
}
