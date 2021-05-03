import {System} from './System';
import { Entity } from './Entity';
import { Component } from './Component';
import { ConstructorArgs, Constructor, Offset1 } from '../util/util';
import bitset from 'mnemonist/bit-set';
import { assert } from '../core/core';

const MAX_COMPONENT_NUM = 256;

class ComponentMask{
  mask: bitset = new bitset(MAX_COMPONENT_NUM);

  set(family: number){
    this.mask.set(family, 1);
  }

  reset(family: number){
    this.mask.reset(family, 0);
  }

  has(family: number){
    return this.mask.test(family);
  }
  
  hasComponents(families: number[]){
    for(let family of families){
      if(!this.has(family)){
        return false;
      }
    }
    return true;
  }

  clear() {
    this.mask.clear();
  }

  forEach(fn: (family:number)=>void) {
    [...this.mask].forEach((b, i)=> {
      if(b){
        fn(i);
      }
    });
  }
}

export class World {
  idSeq: number = 0;
  systems: System<any>[] = [];
  componentMasks: ComponentMask[] = []; 
  componentPools: Map<number, Map<number, Component>> = new Map();
  entityFreeList: number[] = [];

  update<Context>(dt: number, context: Context){
    this.systems
    .sort((a,b)=> b.priority - a.priority)
    .map(e=> (e.preUpdate(dt, context), e))
    .map(e=> (e.update(dt, context), e))
    .map(e=> (e.postUpdate(dt, context), e));
  }

  addSystem<T extends System<any>,U>(component: Constructor<T> & U, ...args: Offset1<ConstructorArgs<U>>) {
    let c = new component(this, ...args);
    this.systems.push(c);
    return c as T;
  }

  createEntity(): Entity {
    let index = this.entityFreeList.pop() || this.idSeq++;
    
    if(this.componentMasks.length < index){
      this.componentMasks.push(new ComponentMask());
    }else{
      this.componentMasks[index] = new ComponentMask();
    }

    return new Entity(this, index);
  }

  destroyEntity(id: number) {
    // console.log("destroy!",id)
    this.componentMasks[id].forEach((e)=>this.removeComponentF(new Entity(this, id), e));
    this.componentMasks[id].clear();
    this.entityFreeList.push(id);
  }

  addComponent<T extends Component, U>(entity: Entity, component: Constructor<T> & {family: number} & U, ...args: ConstructorArgs<U>): T {
    const family = component.family;
    let pool = this.componentPools.get(family);

    if(pool === undefined){
      pool = new Map();
      this.componentPools.set(family, pool);
    }

    let c = new component(...args);
    pool.set(entity.id, c);
    
    this.componentMasks[entity.id]. set(family);

    return c as T;
  }

  removeComponentF(entity: Entity, family: number){
    let pool = this.componentPools.get(family);
    if(pool === undefined){
      return;
    }

    let c = pool.get(entity.id)
    if(c){
      c.destroyed();
      pool.delete(entity.id);
    }
    
    this.componentMasks[entity.id].reset(family);

  }
  
  removeComponent<T extends Component>(entity: Entity, component: Constructor<T> & {family: number}) {
    const family = component.family;
    this.removeComponentF(entity, family)
  }
  
  getComponent<T extends Component>(entity: Entity, component: Constructor<T> & {family: number}): T | undefined {
    let pool = this.componentPools.get(component.family);
    if(pool === undefined){
      return undefined;
    }
    
    return pool.get(entity.id) as T | undefined;
  }
  
  * makeIterator(families: number[]) {
    for (let i = 0; i < this.idSeq; i++) {
      assert(i < this.componentMasks.length);
      if(!this.componentMasks[i].hasComponents(families)){
        continue;
      }

      yield new Entity(this, i);
    }
  }

  makeEntitiyGenerator(requirements: {family: number}[]) {
    return this.makeIterator(requirements.map(e=>e.family));
  }

  getEntities(requirements: {family: number}[]) {
    return [...this.makeEntitiyGenerator(requirements)];
  }

  forEach(requirements: {family: number}[], fn: (e: Entity)=>void){
    for (let e of this.makeEntitiyGenerator(requirements)) {
      fn(e);
    }
  }
}