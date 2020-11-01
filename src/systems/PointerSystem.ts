import { System } from '../libs/ecs/System';
import { GameContext } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { PointerComponent } from '../components/PointerComponent';
import { MoveComponent } from '../components/MoveComponent';

export class PointerSystem extends System<GameContext>  {
  constructor(){
    super([PointerComponent,PositionComponent, MoveComponent]);
  }

  update(dt: number, context: GameContext) {
    this.forEach(e=>{
      const pos = e.getComponent(PositionComponent);
      const move = e.getComponent(MoveComponent);
      const pointerComponent = e.getComponent(PointerComponent);
      if(pos === undefined ||
        pointerComponent === undefined ||
        move === undefined ||
        context.view === undefined){
        return;
      }

      const pointer = pointerComponent.scene.input.activePointer;
      if(0 < pointer.x && pointer.x < pointerComponent.scene.cameras.main.width &&
        0 < pointer.y && pointer.y < pointerComponent.scene.cameras.main.height){
        const worldPointer = context.view.transformViewToWorld(pointer);
        // move.x = worldPointer.x - pos.x;
        // move.y = worldPointer.y - pos.y;
      }
    })
  }
}