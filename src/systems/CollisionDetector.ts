import _ from 'lodash';
import { Entity } from '../libs/ecs/ecs';
import * as Core from '../libs/core/core';
import { PositionComponent } from '../components/PositionComponent';
import { CollideableComponent } from '../components/CollideableComponent';
import { MoveComponent } from '../components/MoveComponent';
import { DirectionComponent } from '../components/DirectionComponent';
import { getAngle } from '../libs/util/util';

export class Candidate {
    pos: Core.Math.Vector2;
    angle: number;
    coll: CollideableComponent;
    entity: Entity;
    constructor(x: number, y: number, angle: number, coll: CollideableComponent, entity: Entity){
      this.pos = new Core.Math.Vector2(x,y);
      this.angle = angle;
      this.coll = coll;
      this.entity = entity;
    }
}

const PARTITION_SIZE = 50;

export class CollisionDetector {
  static detect(entities: Entity[], collided: (left: Candidate,right: Candidate)=>void){
    const grid: Map<string, Candidate[]> = new Map();

    CollisionDetector.collect(grid, entities);
    CollisionDetector.collide(grid, collided);
  }

  static collect(grid: Map<string, Candidate[]>, entities: Entity[]){
    entities.forEach(e=>{
      const pos = e.getComponent(PositionComponent);
      const coll = e.getComponent(CollideableComponent);
      const move = e.getComponent(MoveComponent); // optional
      const angle = getAngle(new Core.Math.Vector2(e.getComponent(DirectionComponent))); // optional
      if(pos === undefined ||
        coll === undefined){
        return;
      }
      
      const mv = move?.totalMove() || {x: 0, y: 0};
      const left = Math.floor((pos.x + mv.x - (coll.shape.getAABB(angle).width/2)) / PARTITION_SIZE);
      const right = Math.floor((pos.x + mv.x + (coll.shape.getAABB(angle).width/2)) / PARTITION_SIZE);
      const up = Math.floor((pos.y + mv.y - (coll.shape.getAABB(angle).height/2)) / PARTITION_SIZE);
      const bottom = Math.floor((pos.y + mv.y + (coll.shape.getAABB(angle).height/2)) / PARTITION_SIZE);
      const candidate = new Candidate(pos.x + mv.x, pos.y + mv.y, angle, coll, e);
      
      const getKey = (x: number, y: number)=>{
        return `${x},${y}`;
      }
      
      const slots = [
        getKey(left,up),
        getKey(right,up),
        getKey(left,bottom),
        getKey(right,bottom)
      ]
      
      const get = (key: string)=> {
        let arr = grid.get(key);
        if(arr === undefined){
          arr = [];
          grid.set(key, arr);
        }
        return arr;
      }

      get(slots[0]).push(candidate);
      if(slots[0] !== slots[1]) {get(slots[1]).push(candidate)}
      if(slots[0] !== slots[2] && slots[1] !== slots[2]) {get(slots[2]).push(candidate)}
      if(slots[0] !== slots[3] && slots[1] !== slots[3] && slots[2] !== slots[3]) {get(slots[3]).push(candidate)}
    })
  }

  static collide(grid: Map<string, Candidate[]>, collided: (left: Candidate,right: Candidate)=>void) {
    grid.forEach(candidates=>{
      candidates.forEach(left => {
        candidates.forEach(right =>{
          if(left.entity.id === right.entity.id){
            return;
          }
          if(CollisionDetector.isCollide(left, right)){
            collided(left, right);
          }
        })
      })
    })
  }
  
  static isCollide(left: Candidate,right: Candidate) {
    return left.coll.shape.hit(left.pos, left.angle, right.coll.shape, right.pos, right.angle);
  }
}