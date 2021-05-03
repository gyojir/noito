import { Component } from './Component';
import { World } from './World';
import { Entity } from './Entity';

export class System<Context> {
  world: World;
  priority: number;
  requirements: {family: number}[] = [];
  constructor(world: World, requirements: {family: number}[], priority = 1) {
    this.requirements = requirements;
    this.priority = priority;
    this.world = world;
  }
  
  preUpdate(dt: number, context: Context){
  }

  update(dt: number, context: Context){
  }
  
  postUpdate(dt: number, context: Context){
  }

  getEntities(){
    return this.world?.getEntities(this.requirements) || [];
  }

  forEach(fn: (e: Entity)=>void){
    this.world?.forEach(this.requirements, fn);
  }
}