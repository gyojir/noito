import * as PIXI from 'pixi.js'
import { Component } from '../libs/ecs/Component';

export class GraphNodeComponent extends Component {
  static family: number = Component.getFamily(GraphNodeComponent);
  node: PIXI.Container;
  rotate: boolean;
  
  constructor(scene: PIXI.Container, x: number, y: number, zIndex: number, rotate: boolean = true) {
    super();
    this.node = new PIXI.Container();
    this.node.x = x;
    this.node.y = y;
    this.node.zIndex = zIndex;
    this.rotate = rotate;
    scene.addChild(this.node);
  }

  destroyed() {
    this.node.destroy();
  }
}