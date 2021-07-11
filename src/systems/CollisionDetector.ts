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
    const grid: Map<string, Map<number, Candidate>> = new Map();

    CollisionDetector.collect(grid, entities);
    CollisionDetector.collide(grid, collided);
  }

  static collect(grid: Map<string, Map<number, Candidate>>, entities: Entity[]){
    entities.forEach(e=>{
      const pos = e.getComponent(PositionComponent);
      const coll = e.getComponent(CollideableComponent);
      const move = e.getComponent(MoveComponent); // optional
      const angle = getAngle(new Core.Math.Vector2(e.getComponent(DirectionComponent))); // optional
      if(pos === undefined ||
        coll === undefined){
        return;
      }
      
      const aabb = coll.shape.getAABB(angle);
      const mv = move?.totalMove() || {x: 0, y: 0};
      const left = Math.floor((pos.x + mv.x - (aabb.width/2)) / PARTITION_SIZE);
      const right = Math.floor((pos.x + mv.x + (aabb.width/2)) / PARTITION_SIZE);
      const up = Math.floor((pos.y + mv.y - (aabb.height/2)) / PARTITION_SIZE);
      const bottom = Math.floor((pos.y + mv.y + (aabb.height/2)) / PARTITION_SIZE);
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
          arr = new Map();
          grid.set(key, arr);
        }
        return arr;
      }

      get(slots[0]).set(candidate.entity.id, candidate);
      if(slots[0] !== slots[1]) {get(slots[1]).set(candidate.entity.id, candidate)}
      if(slots[0] !== slots[2] && slots[1] !== slots[2]) {get(slots[2]).set(candidate.entity.id, candidate)}
      if(slots[0] !== slots[3] && slots[1] !== slots[3] && slots[2] !== slots[3]) {get(slots[3]).set(candidate.entity.id, candidate)}
    })
  }

  static collide(grid: Map<string, Map<number, Candidate>>, collided: (left: Candidate,right: Candidate)=>void) {
    grid.forEach(candidates=>{
      candidates.forEach(left => {
        candidates.delete(left.entity.id);
        candidates.forEach(right => {
          if(CollisionDetector.isCollide(left, right)){
            collided(left, right);
          }
        });
      });
    });
  }
  
  static isCollide(left: Candidate,right: Candidate) {
    return left.coll.shape.hit(right.coll.shape, {aPos: left.pos, aAngle: left.angle, bPos: right.pos, bAngle: right.angle});
  }
}