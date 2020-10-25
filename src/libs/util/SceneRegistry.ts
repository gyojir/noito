import { Constructor } from './util';

const SceneRegistry: Constructor<Phaser.Scene>[] = [];

export default SceneRegistry;
export const register = (scene: Constructor<Phaser.Scene>) => SceneRegistry.splice(0,0,scene); // 先頭のsceneが自動で生成されるため
export const clearSceneRegistry = () => SceneRegistry.length = 0;