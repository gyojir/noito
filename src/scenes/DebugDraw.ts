import * as PIXI from 'pixi.js'
import * as Core from '../libs/core/core';
import { Polygon, Circle, Box, Shape, ShapeBase } from '../libs/util/Shape';
import { View } from '../libs/view/View';

export class DebugDraw {
  private static _instance?: DebugDraw;
  defaultGraphics: PIXI.Graphics;
  viewGraphicsMap: Map<View, PIXI.Graphics>;
  private constructor(){
    this.defaultGraphics = new PIXI.Graphics();
    this.defaultGraphics.zIndex = 10000;

    this.viewGraphicsMap = new Map();
  }
  
  public static get Instance()
  {
      return this._instance || (this._instance = new this());
  }

  clear(){
    this.viewGraphicsMap.forEach((graphics)=>{
      graphics.clear();
      graphics.lineStyle(1, 0xff0000);
    })
    this.defaultGraphics.clear();
    this.defaultGraphics.lineStyle(1, 0xff0000);
  }

  drawShape(shape: ShapeBase, pos: Core.Types.Math.Vector2Like, angle: number, view?: View): void {
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

    if(shape instanceof Circle){
      this.drawCircle(shape, pos, graphics);
    }else if(shape instanceof Box){
      this.drawBox(shape, pos, angle, graphics);
    }else if(shape instanceof Polygon){
      this.drawPolygon(shape, pos, angle, graphics);
    }
  }
  
  drawCircle(shape: Circle, pos: Core.Types.Math.Vector2Like, graphics: PIXI.Graphics = this.defaultGraphics){
    graphics.drawCircle(pos?.x || 0, pos?.y || 0, shape.radius);
  }
  drawBox(shape: Box, pos: Core.Types.Math.Vector2Like, angle: number, graphics: PIXI.Graphics = this.defaultGraphics){
    graphics.drawPolygon(shape.getPolygon(angle).points.map(p => new PIXI.Point((pos.x || 0) + (p.x || 0),(pos.y || 0) + (p.y || 0))));
  }
  drawPolygon(shape: Polygon, pos: Core.Types.Math.Vector2Like, angle: number, graphics: PIXI.Graphics = this.defaultGraphics){
    graphics.drawPolygon(shape.points.map(p => new PIXI.Point((pos.x || 0) + (p.x || 0),(pos.y || 0) + (p.y || 0))));
  }
}