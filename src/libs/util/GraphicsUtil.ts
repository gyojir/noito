import * as PIXI from 'pixi.js'
import * as Core from '../core/core';
import { Polygon, Circle, Box, ShapeBase } from './Shape';
import { alphaF32 } from './util';

export class GraphicsUtil {
  static setVisible(graphics: PIXI.Graphics, visible: boolean) {
    graphics.visible = visible;
  }

  static clear(graphics: PIXI.Graphics) {
    graphics.clear();
    graphics.lineStyle(1, 0xffffffff);
  }

  static setColor(graphics: PIXI.Graphics, color: number, fill: boolean) {
    const c = (0xFF << 24) | color;
    const a = alphaF32(color);
    graphics.lineStyle(1, c, a);
    graphics.fill.alpha = a;
    graphics.fill.color = c;
    graphics.fill.visible = fill;
  }

  static drawShape(graphics: PIXI.Graphics, shape: ShapeBase, pos: Core.Types.Math.Vector2Like, angle: number, color: number = 0xffffffff, fill: boolean = false): void {   
    this.setColor(graphics, color, fill);

    if(shape instanceof Circle){
      GraphicsUtil.drawCircle(shape, pos, graphics);
    }else if(shape instanceof Box){
      GraphicsUtil.drawBox(shape, pos, angle, graphics);
    }else if(shape instanceof Polygon){
      GraphicsUtil.drawPolygon(shape, pos, angle, graphics);
    }
  }
  
  static drawCircle(shape: Circle, pos: Core.Types.Math.Vector2Like, graphics: PIXI.Graphics){
    graphics.drawCircle(pos?.x || 0, pos?.y || 0, shape.radius);
  }
  static drawBox(shape: Box, pos: Core.Types.Math.Vector2Like, angle: number, graphics: PIXI.Graphics){
    graphics.drawPolygon(shape.getPolygon(angle).points.map(p => new PIXI.Point((pos.x || 0) + (p.x || 0),(pos.y || 0) + (p.y || 0))));
  }
  static drawPolygon(shape: Polygon, pos: Core.Types.Math.Vector2Like, angle: number, graphics: PIXI.Graphics){
    graphics.drawPolygon(shape.points.map(p => new PIXI.Point((pos.x || 0) + (p.x || 0),(pos.y || 0) + (p.y || 0))));
  }
}