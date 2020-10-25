import { Constructor } from '../libs/util/util';

type ViewportSetting = {
  x: number,
  y: number,
  width: number,
  height: number
};

export default (
  key: string,
  targetKey: string,
  filters: {ctor: Constructor<Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline>,
  args: (that:any)=>any[]}[]
) => {
  return class extends Phaser.Scene {
    defaultRenderTex: Phaser.GameObjects.RenderTexture | undefined;
    renderTexs: { rt: Phaser.GameObjects.RenderTexture, pipeline: string }[] = [];
    gameScene: Phaser.Scene | undefined;
    constructor() {
      super({ key: key, active: false });
    }
  
    create() {
      this.gameScene = this.scene.get(targetKey);

      // カメラ設定インポート
      this.cameras.main.setBackgroundColor(this.gameScene.cameras.main.backgroundColor.color32);

      // テクスチャ作成
      this.defaultRenderTex = this.add.renderTexture(0, 0, this.cameras.main.width, this.cameras.main.height);
      this.defaultRenderTex.camera = this.gameScene.cameras.main; // カメラインポート
  
      // ポストエフェクト
      if (this.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
        const renderer = this.game.renderer;
        filters.forEach(f => {
          renderer.addPipeline(f.ctor.name, new f.ctor(...f.args(this)));
          const rt = this.add.renderTexture(0, 0, this.cameras.main.width, this.cameras.main.height);
          this.renderTexs.push({ rt, pipeline: f.ctor.name });
        })
  
        this.events.on('destroy', () => {
          filters.forEach(f => {
            renderer.removePipeline(f.ctor.name);
            renderer.removePipeline(f.ctor.name);
          });
        });
      }
    }
  
    update(time: number, delta: number) {
      // デフォルト描画
      if(!this.defaultRenderTex ||
        !this.gameScene){
        return;
      }
      // シーンのカメラ設定を保存しておく
      const sceneCamParam = this.getSceneViewport();
      this.resetViewport();
      
      this.defaultRenderTex.clear();
      this.defaultRenderTex.draw(this.gameScene.children);
      let precedingTex = this.defaultRenderTex;
      
      this.renderTexs.forEach(({ rt, pipeline }, i) => {
        precedingTex?.setPipeline(pipeline);
        precedingTex?.setFlipY(true);         // pipeline付きのテクスチャをRenderTextureに描画すると反転してしまう（rtのサイズがシーンより小さいとさらにバグる）
        rt.resetPipeline();                   // drawするrtにpipelineがセットされているとマズい
        rt.clear();
        rt.draw(precedingTex, 0, 0);
        rt.setVisible(true);
        // precedingTex?.clear();
        precedingTex?.resetFlip()
        precedingTex?.resetPipeline();
        precedingTex?.setVisible(false);
        precedingTex = rt;
      });

      // ビューポート設定
      this.restoreSceneViewport(sceneCamParam);
    }
  
    destroy() {
      this.children.removeAll();
    }

    getSceneViewport(): ViewportSetting {
      return {
        x: this.defaultRenderTex?.camera.x || 0,
        y: this.defaultRenderTex?.camera.y || 0,
        width: this.defaultRenderTex?.camera.width || 0,
        height: this.defaultRenderTex?.camera.height || 0,
      };
    }

    // シーンのビューポートを取り込む
    restoreSceneViewport(param: ViewportSetting){
      this.defaultRenderTex?.camera.setViewport(
        param.x,
        param.y,
        param.width,
        param.height);

      this.cameras.main.setViewport(
        param.x,
        param.y,
        param.width,
        param.height);
    }

    // gameのビューポートを取り込む
    // RenderTextureに描画するときはこれを使う
    resetViewport(){
      this.defaultRenderTex?.camera.setViewport(
        0,
        0,
        this.game.canvas.width,
        this.game.canvas.height);
    
      this.cameras.main.setViewport(
        0,
        0,
        this.game.canvas.width,
        this.game.canvas.height);
    }
  }
}