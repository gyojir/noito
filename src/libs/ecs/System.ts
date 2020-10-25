import { Component } from './Component';
import { World } from './World';
import { Entity } from './Entity';

export class System<Context> {
  world: World | undefined;
  priority: number;
  requirements: {family: number}[] = [];
  constructor(requirements: {family: number}[], priority = 1) {
    this.requirements = requirements;
    this.priority = priority;
  }

  update(dt: number, context: Context){
  }

  getEntities(){
    return this.world?.getEntities(this.requirements) || [];
  }

  forEach(fn: (e: Entity)=>void){
    this.world?.forEach(this.requirements, fn);
  }
}