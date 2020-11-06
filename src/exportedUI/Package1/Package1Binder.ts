/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import * as pixi_fairygui from 'pixi_fairygui';
import { FComponent, ExtendedAnimeInstance } from 'pixi_fairygui/dist/def/index';

export class UI_Main {
	public component: FComponent;
	public _n0: PIXI.Text;
	public _n1: PIXI.AnimatedSprite;
	public _n2: UI_Button1;
	public _n4: PIXI.Text;
	public _t0: ExtendedAnimeInstance;
	public static URL: string = "ui://cijf2vuwaanj0";

	constructor(component: FComponent) {
		this.component = component;
		this._n0 = <PIXI.Text>(this.component.getChildByName("n0"));
		this._n1 = <PIXI.AnimatedSprite>(this.component.getChildByName("n1"));
		this._n2 = new UI_Button1(<FComponent>(this.component.getChildByName("n2")));
		this._n4 = <PIXI.Text>(this.component.getChildByName("n4"));
		this._t0 = <ExtendedAnimeInstance>(this.component.transition?.["t0"]);
	}
}

export class UI_Button1 {
	public component: FComponent;
	public _n0: PIXI.Container;
	public _n1: PIXI.Container;
	public _n2: PIXI.Container;
	public static URL: string = "ui://cijf2vuwhwsd3";

	constructor(component: FComponent) {
		this.component = component;
		this._n0 = <PIXI.Container>(this.component.getChildByName("n0"));
		this._n1 = <PIXI.Container>(this.component.getChildByName("n1"));
		this._n2 = <PIXI.Container>(this.component.getChildByName("n2"));
	}
}

export class Package1Binder {
	create: ReturnType<typeof pixi_fairygui.addPackage>;
	constructor(app: { loader: PIXI.Loader }) {
		this.create = pixi_fairygui.addPackage(app, 'Package1');
	}
	createUI_Main(): UI_Main {
		return new UI_Main(this.create('Main'));
	}
	createUI_Button1(): UI_Button1 {
		return new UI_Button1(this.create('Button1'));
	}
}