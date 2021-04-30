import * as PIXI from 'pixi.js'
import { Component } from '../libs/ecs/Component';

export class SpriteComponent extends Component {
  static family: number = Component.getFamily(SpriteComponent);
  sprite: PIXI.Sprite;
  
  constructor(scene: PIXI.Container, texture: PIXI.Texture, colorTint?: number, x?: number, y?: number, zIndex?: number) {
    super();
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    this.sprite.x = x || 0;
    this.sprite.y = y || 0;
    this.sprite.zIndex = zIndex || 0;
    if(colorTint){
      this.sprite.tint = colorTint;
    }
    scene.addChild(this.sprite);
  }

  destroyed() {
    this.sprite.destroy();
  }
}