import * as PIXI from 'pixi.js'
import * as Core from '../core/core';
import { Camera } from "./Camera";

export class View {
  camera: Camera;
  width: number;
  height: number;

  private offsetContainer: PIXI.Container; // 中心を原点にする
  container: PIXI.Container;

  // デバッグ用
  debugOffsetContainer: PIXI.Container;
  debugContainer: PIXI.Container;

  renderTex: PIXI.RenderTexture;
  renderSprite: PIXI.Sprite;

  constructor(width: number, height: number){
    this.height = height;
    this.width = width;
    this.camera = new Camera();

    // コンテナツリー
    // renderTex
    // +-offsetContainer
    //     +-container
    // debugOffsetContainer
    // +-debugContainer
    this.offsetContainer = new PIXI.Container();
    this.container = new PIXI.Container();
    this.offsetContainer.addChild(this.container);

    this.debugOffsetContainer = new PIXI.Container();
    this.debugContainer = new PIXI.Container();
    this.debugOffsetContainer.addChild(this.debugContainer);
    
    // 中心を0にする
    this.offsetContainer.x = width / 2;
    this.offsetContainer.y = height / 2;
    this.debugOffsetContainer.x = width / 2;
    this.debugOffsetContainer.y = height / 2;

    this.renderTex = PIXI.RenderTexture.create({width: width, height: height});
    this.renderSprite = new PIXI.Sprite(this.renderTex);
  }

  update(){
    this.camera.update(this.container);
    this.camera.update(this.debugContainer);
  }

  render(renderer: PIXI.Renderer){
    renderer.render(this.offsetContainer, this.renderTex);
  }
  
  worldToViewMatrixWithoutTranslate(){
    let mat = new Core.Math.Matrix3();
    mat.scale(new Core.Math.Vector2(1,-1));
    return mat;
  }
  

  // ワールド座標→ビューポート座標に変換（行列は逆順に作る）
  worldToViewMatrix(){
    let mat = new Core.Math.Matrix3();
    mat.scale(new Core.Math.Vector2(1,-1));                             // y軸を下向きにする
    mat.translate(new Core.Math.Vector2(this.width/2, -this.height/2)); // 左上を原点にする
    mat.translate(this.camera.pos.clone().scale(-1));                   // ワールド座標系→カメラ座標系
    return mat;
  }

  // ビューポート座標→ワールド座標に変換
  transformViewToWorld(pos: Core.Types.Math.Vector2Like){
    return (new Core.Math.Vector2(pos)).transformMat3(this.worldToViewMatrix().invert());
  }

  // ワールド座標→ビューポート座標に変換
  transformWorldToView(pos: Core.Types.Math.Vector2Like){
    return (new Core.Math.Vector2(pos)).transformMat3(this.worldToViewMatrix());
  }
}
