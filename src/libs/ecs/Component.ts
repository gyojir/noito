import { Constructor } from '../util/util';
export class Component {
  static familyCounter = 0;
  static family: number | undefined = undefined;
  static getFamily<T extends Component>(c: Constructor<T> & {family: number}): number {
    return c.family !== undefined ? c.family : Component.familyCounter++;
  }
  constructor() {
    if(new.target === Component){
      throw "Component is Abstruct class";
    }
    if((this.constructor as any).family === undefined){
      throw "Component must call getFamily()";
    }
  }

  destroyed() {    
  }

  getFamily(): number {
    return (this.constructor as any).family;
  }
}