import { Component } from '../libs/ecs/Component';
import { ShapeBase } from '../libs/util/Shape';
import { ValueOf } from '../libs/util/util';

export const EnemyType = {
  White: 0,
  Blue: 1,
};

export class EnemyComponent extends Component {
  static family: number = Component.getFamily(EnemyComponent);
  enable = false;
  shape: ShapeBase;
  type: ValueOf<typeof EnemyType>;
  constructor(shape: ShapeBase, type: ValueOf<typeof EnemyType>){
    super();
    this.shape = shape;
    this.type = type;
  }
}