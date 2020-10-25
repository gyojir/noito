import { System } from '../libs/ecs/ecs';
import { GameContext } from '../scenes/MainScene';
import { PositionComponent } from '../components/PositionComponent';
import { CommonInfoComponent } from '../components/CommonInfoComponent';
import { MoveComponent } from '../components/MoveComponent';

export class DestroySystem extends System<GameContext> {
  constructor(){
    super([]);
  }

  update(dt: number, context: GameContext) {
    this.forEach(e=>{
      const pos = e.getComponent(PositionComponent);
      const info = e.getComponent(CommonInfoComponent);
      // 範囲
      if(pos !== undefined &&
         !(info !== undefined && !info.boundsRemove)){
        const screenPos = pos.getScreenPos(context.view.camera);
        if(screenPos.x < (context.view?.width * -0.5 || 0) ||
          screenPos.y < (context.view?.height * -0.5 || 0) ||
          (context.view?.width * 0.5 || 0) < screenPos.x ||
          (context.view?.height * 0.5 || 0) < screenPos.y) {
          e.destroy();
          return;
        }
      }

      if(info !== undefined){
        if(!info.active){
          e.destroy();
          return;
        }
      }
    })
  }
}