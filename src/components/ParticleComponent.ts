import * as PIXI from 'pixi.js'
import { Component } from '../libs/ecs/Component';
import * as PIXI_particles from 'pixi-particles';

export class ParticleComponent extends Component {
  static family: number = Component.getFamily(ParticleComponent);
  emitter: PIXI_particles.Emitter;
  updator: (deltaTime: number)=>void;
  
  constructor(parent: PIXI.Container, textures: PIXI.Texture[], config: PIXI_particles.EmitterConfig, updator: (deltaTime: number)=>void) {
    super();

    this.emitter = new PIXI_particles.Emitter(parent, textures, config);
    this.updator = updator;
  }

  destroyed() {
    this.emitter.destroy();
  }
}