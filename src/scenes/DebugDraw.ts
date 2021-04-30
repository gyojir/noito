import * as PIXI from 'pixi.js'
import * as Core from '../libs/core/core';
import { ShapeBase } from '../libs/util/Shape';
import { View } from '../libs/view/View';
import { GraphicsUtil } from '../libs/util/GraphicsUtil';

export class DebugDraw {
  private static _instance?: DebugDraw;
  private defaultGraphics: PIXI.Graphics;
  private viewGraphicsMap: Map<View, PIXI.Graphics>;
  private constructor(){
    this.defaultGraphics = new PIXI.Graphics();
    this.defaultGraphics.zIndex = 10000;

    this.viewGraphicsMap = new Map();
  }
  
  public static get Instance()
  {
      return this._instance || (this._instance = new this());
  }

  setVisible(visible: boolean) {
    if(process.env.NODE_ENV !== "development") {
      return;
    }

    this.viewGraphicsMap.forEach(graphics => GraphicsUtil.setVisible(graphics, visible));
    GraphicsUtil.setVisible(this.defaultGraphics, visible);
  }

  clear() {
    if(process.env.NODE_ENV !== "development") {
      return;
    }

    this.viewGraphicsMap.forEach(GraphicsUtil.clear);
    GraphicsUtil.clear(this.defaultGraphics);
  }

  setColor(color: number, fill: boolean) {
    if(process.env.NODE_ENV !== "development") {
      return;
    }

    this.viewGraphicsMap.forEach(graphics => GraphicsUtil.setColor(graphics, color, fill));
    GraphicsUtil.setColor(this.defaultGraphics, color, fill);
  }

  drawShape(shape: ShapeBase, pos: Core.Types.Math.Vector2Like, angle: number, view?: View, color: number = 0xffffffff, fill: boolean = false): void {
    if(process.env.NODE_ENV !== "development") {
      return;
    }

    // Viewが指定されていれば専用Graphicsに書き込む
    let graphics: PIXI.Graphics;
    if(view !== undefined){
      let found = this.viewGraphicsMap.get(view);
      if(found === undefined){
        found = new PIXI.Graphics();
        view.debugContainer.addChild(found);
        this.viewGraphicsMap.set(view, found);
      }
      graphics = found;
    }else{
      graphics = this.defaultGraphics;
    }

    GraphicsUtil.drawShape(graphics, shape, pos, angle, color, fill);
  }
}