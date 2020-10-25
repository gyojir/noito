import * as PIXI from 'pixi.js'
import { initImGui, clearImGui } from './libs/util/util';
import './scenes/RootScene';
import './libs/util/Shape'
import { GAME_WIDTH, GAME_HEIGHT } from './def';
import { createGameRoot } from './scenes/RootScene';
import InputManager from './input/InputManager';
import * as ImGui_Impl from 'imgui-js/example/imgui_impl.js';


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
    backgroundColor: 0x000000,
    transparent: false
  });
  const root = createGameRoot(app);
  
  // 起動
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
