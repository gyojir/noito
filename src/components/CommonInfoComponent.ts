import { Component } from '../libs/ecs/Component';

export class CommonInfoComponent extends Component {
  static family: number = Component.getFamily(CommonInfoComponent);
  boundsRemove: boolean;
  active: boolean = true;
  
  constructor(boundsRemove: boolean = true) {
    super();
    this.boundsRemove = boundsRemove;
  }
}