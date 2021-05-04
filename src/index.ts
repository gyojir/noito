import * as PIXI from 'pixi.js'
import * as mugen from 'mu-gen';
import { initImGui, clearImGui } from './libs/util/util';
import './scenes/AppRoot';
import './libs/util/Shape'
import { GAME_WIDTH, GAME_HEIGHT } from './def';
import { createGameRoot } from './scenes/AppRoot';
import InputManager from './input/InputManager';
import * as ImGui_Impl from 'imgui-js/example/imgui_impl.js';

// init audio
const touchEvent = document.ontouchend !== undefined ? 'touchend' : 'mouseup';
document.addEventListener(touchEvent, initAudio);
async function initAudio() {
  document.removeEventListener(touchEvent, initAudio);
  mugen.setSeed(6961167);
  mugen.createBGM("0", 8, 3);
}
window.addEventListener('focus', () => mugen.destinationNode.context.rawContext.resume());
window.addEventListener('blur', () => mugen.destinationNode.context.rawContext.suspend(0));

// avoid zoom
document.addEventListener("touchend", e=>e.preventDefault(), {passive: false});

// 実行
window.onload = async ()=>{
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  if(process.env.NODE_ENV === "development") {
    const debugCanvas = document.createElement("canvas");
    debugCanvas.width = window.innerWidth;
    debugCanvas.height = window.innerHeight;
    debugCanvas.style.position = "absolute";
    debugCanvas.style.width = "100%";
    debugCanvas.style.height = "100%";
    // 重なり部分のイベント
    [
      'pointerdown',
      'pointerover',
      'pointerup',
      'pointermove',
      'pointerout',
      'pointerupoutside',
      'touchcancel',
      'touchend',
      'touchendoutside',
      'touchmove',
      'touchstart',
    ].forEach(e=> debugCanvas.addEventListener(e,  (ev:any) => canvas.dispatchEvent(new ev.constructor(ev.type, ev))));
    document.body.appendChild(debugCanvas);
    await initImGui(debugCanvas);
  }

  // pixi setting
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
  // create app
  const app = new PIXI.Application({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    view: canvas,
    backgroundColor: 0xFF404040,
    transparent: false,
  });
  const root = createGameRoot(app);
  // app.renderer.plugins.interaction.autoPreventDefault = false;
  
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
