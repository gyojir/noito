import { Constructor, beginImGui, endImGui } from '../util/util';

export type StateType = { [x: string] : string };

export abstract class StateMachineBase {
  static State: StateType;

  destroy(): void {}
  onDestroy(): void {}
  
  abstract update(): void;

  abstract enterState(): void;
  abstract updateState(): void;
  abstract leaveState(): void;
  
  // オーバーライドする用
  onUpdateCalled(): void {}

  debugDraw(): void {}
  abstract debugDrawRecursive(): void;
}

// https://stackoverflow.com/questions/33387318/access-to-static-properties-via-this-constructor-in-typescript
const getStates = <T extends StateMachineBase>(that: T) => (that.constructor as typeof StateMachineBase).State

export abstract class StateMachine<State extends StateType> extends StateMachineBase{
  private _childFuncMap: { -readonly [k in keyof State]?: (()=> StateMachineBase)[] } = {};
  private _childs: { [x : number]: StateMachineBase } = {};
  
  private _weakChildFuncMap: { -readonly [k in keyof State]?: (()=> StateMachineBase)[] } = {};
  private _weakChilds: { [x : number]: StateMachineBase } = {};

  private _enterFunc: { -readonly [k in keyof State]?: Function } = {};
  private _updateFunc: { -readonly [k in keyof State]?: Function } = {};
  private _leaveFunc: { -readonly [k in keyof State]?: Function } = {};
  private _currentState: keyof State;
  private _nextState: keyof State;

  private _stateFrame: number = 0;
  private _exitCode: number = -1;

  constructor(state?: keyof State) {
    super();

    // default State
    state = state || Object.values(getStates(this))[0];

    this._currentState = -1;
    this._nextState = state;
  }

  destroy(): void {
    // 子供破棄
    this.allChilds.forEach(e => {
      e.destroy();
    });
    
    this.callLeaveState();
    this.onDestroy();
    
    this._childs = [];
    this._weakChilds = [];
    this._childFuncMap = {};
    this._weakChildFuncMap = {};
    this._enterFunc = {};
    this._updateFunc = {};
    this._leaveFunc = {};
  }
  
  getChild<U extends StateMachineBase>(id: number): U | undefined {
    return this._childs[id] as U | undefined
  }
  getWeakChild<U extends StateMachineBase>(id: number): U | undefined {
    return this._weakChilds[id] as U | undefined
  }

  addChild<U extends StateMachineBase>(state: keyof State, childFunc: () => U): number {
    let funcList = this._childFuncMap[state];
    if(!funcList){
      funcList = [];
    }
    let id = funcList.length;
    funcList.push(childFunc);
    this._childFuncMap[state] = funcList;

    return id;
  }

  // 更新を管理しない子供
  addWeakChild<U extends StateMachineBase>(state: keyof State, childFunc: () => U): number {
    let funcList = this._weakChildFuncMap[state];
    if(!funcList){
      funcList = [];
    }
    let id = funcList.length;
    funcList.push(childFunc);
    this._weakChildFuncMap[state] = funcList;

    return id;    
  }

  private createChilds(): void {
    let funcList = this._childFuncMap[this._currentState];
    funcList?.forEach((c,i)=> this._childs[i] = c())
    
    let weakFuncList = this._weakChildFuncMap[this._currentState];
    weakFuncList?.forEach((c,i)=> this._weakChilds[i] = c())
  }

  //--------------------------------------------------
  // implement StateMachineBase
  //--------------------------------------------------

  update(): void {
    this.updateState();
    this.onUpdateCalled();
  }

  enterState(): void {
    this.callEnterState();

    // 子供作る
    this.createChilds();
  }

  updateState(): void {
    // ステート遷移処理
    if(this._currentState !== this._nextState){
      this.leaveState();
      this._currentState = this._nextState;
      this.enterState();
    }

    // 子供を先に更新
    Object.values(this._childs).forEach(c => c.update());

    this.callUpdateState();    
    this._stateFrame++;
  }

  leaveState(): void {    
    // 子供が先に抜ける(破棄する)
    this.allChilds.forEach(c => { 
      c.destroy();
    });
    this._childs = {};
    this._weakChilds = {};

    this.callLeaveState();
    this._stateFrame = 0;
  }

  private callEnterState(): void {
    const f = this._enterFunc[this._currentState];
    f && f();
  }

  private callUpdateState(): void {
    const f = this._updateFunc[this._currentState];
    f && f();
  }

  private callLeaveState(): void {
    const f = this._leaveFunc[this._currentState];
    f && f();
  }
  
  //--------------------------------------------------
  // デバッグ描画
  //--------------------------------------------------
  
  // デバッグ再帰呼び出し
  readonly debugDrawRecursive = (): void => {
    this.debugDraw();
    this.allChilds.forEach(e => {
      e.debugDrawRecursive()
    })
  }

  //--------------------------------------------------
  // getter setter
  //--------------------------------------------------
  
  get enterFunc() {
    return this._enterFunc;
  }
  get updateFunc() {
    return this._updateFunc;
  }
  get leaveFunc() {
    return this._leaveFunc;
  }

  get stateFrame(): number {
    return this._stateFrame;
  }

  get exitCode(): number {
    return this._exitCode;
  }
  set exitCode(exitCode: number) {
    this._exitCode = exitCode;
  }

  get nextState(): keyof State {
    return this._nextState;
  }
  set nextState(state: keyof State) {
    this._nextState = state;
  }
  
  get allChilds(): StateMachineBase[] {
    return [...Object.values(this._childs), ...Object.values(this._weakChilds)];
  }
}