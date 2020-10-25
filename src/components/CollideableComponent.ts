import { Component, Entity } from '../libs/ecs/ecs';
import { ShapeBase } from '../libs/util/Shape';

export class CollideableComponent extends Component {
  static family: number = Component.getFamily(CollideableComponent);
  shape: ShapeBase;
  hitList: Entity[] = [];
  
  constructor(shape: ShapeBase) {
    super();
    this.shape = shape || 0;
  }

  clear(){
    this.hitList = [];
  }
}