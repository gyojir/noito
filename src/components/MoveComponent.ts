import { Component } from '../libs/ecs/Component';

type Move = {
  x: number;
  y: number;
}

export class MoveComponent extends Component {
  static family: number = Component.getFamily(MoveComponent);
  map: Map<string, Move> = new Map();
  
  constructor() {
    super();
  }

  getMove(key: string){
    let mv = this.map.get(key);
    if(mv === undefined){
      mv = {x:0, y: 0};
      this.map.set(key, mv);
    }
    return mv;
  }

  totalMove(){
    return [...this.map.values()].reduce((prev, curr)=>({
      x: curr.x + prev.x,
      y: curr.y + prev.y
    }), {x:0, y:0});

  }
}