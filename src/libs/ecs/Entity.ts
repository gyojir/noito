import { Component } from './Component';
import { World } from './World';
import { ConstructorArgs, Constructor } from '../util/util';

export class Entity {
  id: number;
  world: World;
  constructor (world: World, id: number) {
    this.id = id;;
    this.world = world;
  }

  addComponent<T extends Component,U>(component: Constructor<T> & {family: number} & U, ...args: ConstructorArgs<U>){
    return this.world.addComponent(this, component, ...args);
  }

  getComponent<T extends Component>(component: Constructor<T> & {family: number}): T | undefined{
    return this.world.getComponent(this, component);
  }

  destroy(){
    this.world.destroyEntity(this.id);
  }
}