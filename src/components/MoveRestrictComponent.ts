import { Component } from '../libs/ecs/Component';
import * as Core from '../libs/core/core';

export class MoveRestrictComponent extends Component {
  static family: number = Component.getFamily(MoveRestrictComponent);
  lines: Core.Curves.Line[] = [];
  constructor() {
    super();
  }
}