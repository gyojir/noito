import * as PIXI from 'pixi.js';
import * as ImGui from 'imgui-js/imgui.js';
import * as ImGui_Impl from 'imgui-js/example/imgui_impl.js';
import * as Core from '../core/core';

export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

export type Constructor<T> = {new(...args: any): T};
export type ConstructorArgs<T> = T extends new (...args: infer U) => any ? U : never;
export type InstanceOf<T> = T extends new (...args: any) => infer R ? R : never;
export type ClassType<T> = {new(...args: ConstructorArgs<T>): InstanceOf<T>};

export type PickType<T, K extends keyof T> = T[K];

export type ValueOf<T> = T[keyof T];

export const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec));

export function selectRand<T>(array: T[]): T;
export function selectRand<T>(obj: {[x: string]: T}): T;
export function selectRand<T>(container: T[] | {[x: string]: T}): T{
  const array = Array.isArray(container)? container : Object.values(container);
  return array[Math.floor(Math.random() * array.length)];
}

export const existFilter = <T>(x: T|undefined|null): x is T => x !== null || x !== undefined;

export const ifExist = <T>(x: T|undefined|null, fn: (x: T)=>void): void => {
  if(existFilter(x)){
    fn(x);
  }
}

export const flatSingle = <T>(arr: T[][]) => ([] as T[]).concat(...arr);

export const range = (num: number) => [...Array(num).keys()];

export const zip = <T,U>(arr1: T[], arr2: U[]): [T,U][] => arr1.map((k, i) => [k, arr2[i]]);

export const clamp = (a: number, min: number, max: number) => Math.min(Math.max(a, min), max);

export const getAngle = (v?: Core.Types.Math.Vector2Like) => new Core.Math.Vector2(v).angle() + Core.Math.TAU;

export function randf(max: number): number;
export function randf(min: number, max: number): number;
export function randf(a: number, b?: number) {
  const min = b !== undefined ? a : 0;
  const max = b !== undefined ? b : a;
  return Math.random() * (max-min) + min;
}

// 1秒あたりおよそperSec回trueを返す
// (dt >= 1000msなら必ずtrue つまり大体1sにx体)
export const randt = (dt:number, perSec: number) => Math.random() * 10000 < dt * 0.001 * perSec * 10000;

// 回転の絶対値を 0~π に抑える
export const rotWrap = (rot: number) => {
  return (rot > Math.PI) ? rot - Math.PI * 2 :
         (rot < Math.PI * -1) ? rot + Math.PI * 2 : rot;
};

/**
 * ImGui初期化
 */
export async function initImGui(canvas: HTMLCanvasElement) {
  await ImGui.default();
  ImGui.IMGUI_CHECKVERSION();
  ImGui.CreateContext();
  ImGui_Impl.Init(canvas.getContext("webgl"));

  const preventFunc = (ev: UIEvent)=>{
    // 逆っぽいけど
    if(!ImGui.IsWindowHovered()){
      ev.preventDefault();
      ev.stopImmediatePropagation();
    }
  };

  canvas.addEventListener( 'pointerdown', preventFunc, false );
  canvas.addEventListener( 'pointerup', preventFunc, false );
  canvas.addEventListener( 'mousedown', preventFunc, false );
  canvas.addEventListener( 'touchstart', preventFunc, false );
}

/**
 * ImGuiフレーム表示開始
 * @param time 時間
 */
export function beginImGui(time: number){
  ImGui_Impl.NewFrame(time);
  ImGui.NewFrame();
  clearImGui();
}

/**
 * ImGuiフレーム表示終了
 */
export function endImGui(){
  ImGui.EndFrame();
  ImGui.Render();
  ImGui_Impl.RenderDrawData(ImGui.GetDrawData());
}

/**
 * ImGuiフレームクリア
 */
export function clearImGui(){
  ImGui_Impl.gl?.clear(ImGui_Impl.gl?.COLOR_BUFFER_BIT);
  ImGui_Impl.ctx?.clearRect(0,0, ImGui_Impl.ctx.canvas.width, ImGui_Impl.ctx.canvas.height);
}

/**
 * ロード待ち
 */
export const loadAsync = async (loader: PIXI.Loader)=>{
  return new Promise<{loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>}>(function(resolve, reject) {
    loader.load(function(loader, resources) {
      resolve({loader, resources});
    });
  });
};