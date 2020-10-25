import * as PIXI from 'pixi.js'
import { Component } from '../libs/ecs/Component';
import TextureList from '../scenes/TextureList';

export class SpriteComponent extends Component {
  static family: number = Component.getFamily(SpriteComponent);
  sprite: PIXI.Sprite;
  
  constructor(scene: PIXI.Container, texture: PIXI.Texture, x: number, y: number, colorTint?: number) {
    super();
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    this.sprite.x = x;
    this.sprite.y = y;
    scene.addChild(this.sprite);
    if(colorTint){
      this.sprite.tint = colorTint;
    }
  }

  destroyed() {
    this.sprite.destroy();
  }
}