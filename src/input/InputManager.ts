import { Pointer } from './Pointer';
import { Keyboard } from './Keyboard';
/**
 * 入力マネージャ
 * シングルトン
 */
class InputManager
{
    private static _instance?: InputManager;
    pointer: Pointer;
    keyboard: Keyboard;

    private constructor()
    {
      this.pointer = new Pointer();
      this.keyboard = new Keyboard();
    }

    public static get Instance()
    {
        return this._instance || (this._instance = new this());
    }

    static destroy(){
      this._instance = undefined;
    }

    update(delta: number){
      this.pointer.update(delta);
      this.keyboard.update(delta);
    }
    postUpdate(){
      this.pointer.postUpdate();
      this.keyboard.postUpdate();
    }
}

export default InputManager;