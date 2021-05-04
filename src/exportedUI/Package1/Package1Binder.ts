/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import * as PIXI from 'pixi.js';
import * as pixi_fairygui from 'pixi_fairygui';
import { FComponent, ExtendedAnimeInstance } from 'pixi_fairygui/dist/def/index';

export class UI_Main {
	public component: FComponent;
	public _n4: PIXI.Text;
	public _n5: PIXI.Text;
	public _n8: PIXI.Text;
	public _t0: ExtendedAnimeInstance;
	public l7s124: string;
	public static URL: string = "ui://cijf2vuwaanj0";

	constructor(component: FComponent) {
		this.component = component;
		this._n4 = <PIXI.Text>(this.component.getChildByName("n4"));
		this._n5 = <PIXI.Text>(this.component.getChildByName("n5"));
		this._n8 = <PIXI.Text>(this.component.getChildByName("n8"));
		this._t0 = <ExtendedAnimeInstance>(this.component.transition?.["t0"]);
		this.l7s124 = "ui://cijf2vuwl7s124";
		PIXI.BitmapFont.available["ui://cijf2vuwl7s124"] = pixi_fairygui.PIXI.BitmapFont.available["ui://cijf2vuwl7s124"];
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
}