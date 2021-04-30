import * as PIXI from 'pixi.js'
import { Component } from '../libs/ecs/Component';

export class GraphNodeComponent extends Component {
  static family: number = Component.getFamily(GraphNodeComponent);
  node: PIXI.Container;
  
  constructor(scene: PIXI.Container, x: number, y: number, zIndex: number) {
    super();
    this.node = new PIXI.Container();
    this.node.x = x;
    this.node.y = y;
    this.node.zIndex = zIndex;
    scene.addChild(this.node);
  }

  destroyed() {
    this.node.destroy();
  }
}