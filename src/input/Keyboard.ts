import defaults from "defaults";

type KeyboardData = {
  downCount: {[x : string]: number}
}

export class Keyboard{
  delta: number = 1;
  data: KeyboardData = {
    downCount: {},
  };
  config: {
    velocityThreshold: number
  };
  
  constructor(config?: {velocityThreshold?: number}){
    this.config = defaults(config, {
      velocityThreshold: 500
    });
    
    // イベント
    window.addEventListener('keydown', (ev)=>{
      if(!this.data.downCount[ev.key] || this.data.downCount[ev.key] <= 0){
        this.data.downCount[ev.key] = 1;
      }
    });
    window.addEventListener('keyup', (ev)=>{
      this.data.downCount[ev.key] = -1;
    });
  }

  update(delta: number){
    this.delta = delta;
  }
  
  postUpdate(){
    Object.keys(this.data.downCount).forEach(key=>{
      if(this.data.downCount[key] > 0){
        this.data.downCount[key]++;
      }
      if(this.data.downCount[key] == -1){
        this.data.downCount[key] = 0;
      }
    })
  }

  isTriggered(key: string){
    return this.data.downCount[key] == 1;
  }
  isDown(key: string){
    return this.data.downCount[key] > 0;
  }
  isReleased(key: string){
    return this.data.downCount[key] == -1;
  }
}
