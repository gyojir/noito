import { Component } from '../libs/ecs/Component';

export class MassComponent extends Component {
  static family: number = Component.getFamily(MassComponent);
  mass: number = 0;
}