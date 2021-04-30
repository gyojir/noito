import SAT from "sat";
import * as Core from '../core/core';

type Vector2 = Core.Types.Math.Vector2Like;

export function toSATCircle(c: Circle, pos?: Vector2){
  return  new SAT.Circle(new SAT.Vector(pos?.x, pos?.y), c.radius);
}
export function toSATBoxPolygon(c: Box, pos?: Vector2, angle: number = 0){
  const s = new SAT.Box(new SAT.Vector(pos?.x, pos?.y), c.width, c.height).toPolygon();
  return applyPolygonOffset(s, angle, - c.width / 2, - c.height / 2);
}
export function toSATPolygon(c: Polygon, pos?: Vector2, angle: number = 0){
  const s = new SAT.Polygon(new SAT.Vector(pos?.x, pos?.y), c.points.map(e=>new SAT.Vector(e.x, e.y)));
  return applyPolygonOffset(s, angle);
}


export function toCircle(c: SAT.Circle){
  return new Circle(c.r);
}
export function toBox(c: SAT.Box){
  return new Box(c.w, c.h);
}
export function toPolygon(c: SAT.Polygon){
  return new Polygon(c.points.map(e=> ({x: e.x, y: e.y})));
}

function getAABB(p: SAT.Polygon){
  const aabb = p.getAABB();
  applyPolygonOffset(aabb, 0);
  return new Box(aabb.points[0].x * 2, aabb.points[0].y * 2);
}

function applyPolygonOffset(p: SAT.Polygon, angle: number = 0, xoffset: number = 0, yoffset:number = 0){
  if(xoffset != 0 && yoffset != 0){
    p.points.forEach(e=> { e.x += xoffset; e.y += yoffset });
  }
  if(angle != 0){
    p.rotate(angle);
  }
  if(p.pos.x != 0 && p.pos.y != 0) {
    p.setPoints(p.points.map(e=> new SAT.Vector(e.x + p.pos.x, e.y + p.pos.y)));
    p.pos.x = 0;
    p.pos.y = 0;
  }
  return p;
}

type Arg<T, Data> = {
  shape: T,
  data: Data,
}

type DispatchFunc<Return, A, B> = (a: A, b: B, flip?: boolean) => Return;
type DispatchFuncMap<Return, Data> = {
  Circle : {
    Circle: DispatchFunc<Return, Arg<Circle, Data>, Arg<Circle, Data>>,
    Square: DispatchFunc<Return, Arg<Circle, Data>, Arg<Box, Data>>,
    Polygon: DispatchFunc<Return, Arg<Circle, Data>, Arg<Polygon, Data>>
  },
  Square: {
    Square: DispatchFunc<Return, Arg<Box, Data>, Arg<Box, Data>>,
    Polygon: DispatchFunc<Return, Arg<Box, Data>, Arg<Polygon, Data>>
  },
  Polygon: {
    Polygon: DispatchFunc<Return, Arg<Polygon, Data>, Arg<Polygon, Data>>
  }
}

type HitData = {
  pos?: Vector2,
  angle?: number
}
const hitFunc = {
  Circle : {
    Circle: function (a: {shape: Circle, data: HitData}, b: {shape: Circle, data: HitData}, flip: boolean = false): [boolean, SAT.Response] {
      const sa = toSATCircle(a.shape, a.data.pos);
      const sb = toSATCircle(b.shape, b.data.pos);
      const response = new SAT.Response();
      return [!flip ? SAT.testCircleCircle(sa, sb, response) : SAT.testCircleCircle(sb, sa, response), response];
    },
    Square: function (a: {shape: Circle, data: HitData}, b: {shape: Box, data:HitData}, flip: boolean = false): [boolean, SAT.Response] {
      const sa = toSATCircle(a.shape, a.data.pos);
      const sb = toSATBoxPolygon(b.shape, b.data.pos, b.data.angle);
      const response = new SAT.Response();
      return [!flip ? SAT.testCirclePolygon(sa, sb, response) : SAT.testPolygonCircle(sb, sa, response), response];
    },
    Polygon: function (a: {shape: Circle, data: HitData}, b: {shape: Polygon, data:HitData}, flip: boolean = false): [boolean, SAT.Response] {
      const sa = toSATCircle(a.shape, a.data.pos);
      const sb = toSATPolygon(b.shape, b.data.pos, b.data.angle);
      const response = new SAT.Response();
      return [!flip ? SAT.testCirclePolygon(sa, sb, response) : SAT.testPolygonCircle(sb, sa, response), response];
    }
  },
  Square: {
    Square: function (a: {shape: Box, data: HitData}, b: {shape: Box, data: HitData}, flip: boolean = false): [boolean, SAT.Response] {
      const sa = toSATBoxPolygon(a.shape, a.data.pos, a.data.angle);
      const sb = toSATBoxPolygon(b.shape, b.data.pos, b.data.angle);
      const response = new SAT.Response();
      return [!flip ? SAT.testPolygonPolygon(sa, sb, response) : SAT.testPolygonPolygon(sb, sa, response), response];
    },
    Polygon: function (a: {shape: Box, data: HitData}, b: {shape: Polygon, data: HitData}, flip: boolean = false): [boolean, SAT.Response] {
      const sa = toSATBoxPolygon(a.shape, a.data.pos, a.data.angle);
      const sb = toSATPolygon(b.shape, b.data.pos, b.data.angle);
      const response = new SAT.Response();
      return [!flip ? SAT.testPolygonPolygon(sa, sb, response) : SAT.testPolygonPolygon(sb, sa, response), response];
    }
  },
  Polygon: {
    Polygon: function (a: {shape: Polygon, data: HitData}, b: {shape: Polygon, data: HitData}, flip: boolean = false): [boolean, SAT.Response] {
      const sa = toSATPolygon(a.shape, a.data.pos, a.data.angle);
      const sb = toSATPolygon(b.shape, b.data.pos, b.data.angle);
      const response = new SAT.Response();
      return [!flip ? SAT.testPolygonPolygon(sa, sb, response) : SAT.testPolygonPolygon(sb, sa, response), response];
    }
  }
};


export abstract class ShapeBase {
  hit(b: ShapeBase, data: {aPos?: Vector2, aAngle?: number, bPos?: Vector2, bAngle?: number}) : boolean {
    return this.dispatch(b, hitFunc, {pos: data.aPos, angle: data.aAngle}, {pos: data.bPos, angle: data.bAngle})[0];
  }
  test(b: ShapeBase, data: {aPos?: Vector2, aAngle?: number, bPos?: Vector2, bAngle?: number}) {
    return this.dispatch(b, hitFunc, {pos: data.aPos, angle: data.aAngle}, {pos: data.bPos, angle: data.bAngle});
  }

  abstract getAABB(angle: number): Box;
  
  abstract dispatch<Return, Data>(b: ShapeBase, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return;
  abstract dispatchCircle<Return, Data>(a: Circle, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return;
  abstract dispatchSquare<Return, Data>(a: Box, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return;
  abstract dispatchPolygon<Return, Data>(a: Polygon, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return;
}

export class Circle extends ShapeBase {
  radius: number;
  constructor(radius: number){
    super();
    this.radius = radius;
  }

  getAABB(angle: number): Box {
    return new Box(this.radius*2, this.radius*2);
  }

  dispatch<Return, Data>(b: ShapeBase, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return {
    return b.dispatchCircle(this, funcMap, _a, _b);
  }
  dispatchCircle<Return, Data>(a: Circle, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return { return funcMap.Circle.Circle({shape: this, data: _b}, {shape: a, data: _a}, true); }
  dispatchSquare<Return, Data>(a: Box, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return { return funcMap.Circle.Square({shape: this, data: _b}, {shape: a, data: _a}, true); }
  dispatchPolygon<Return, Data>(a: Polygon, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return { return funcMap.Circle.Polygon({shape: this, data: _b}, {shape: a, data: _a}, true); }
}

export class Box extends ShapeBase {
  width: number;
  height: number;
  constructor(width: number, height: number){
    super();
    this.width = width;
    this.height = height
  }
  
  getAABB(angle: number): Box {
    return getAABB(toSATBoxPolygon(this, {}, angle));
  }
  
  getPolygon(angle: number): Polygon {
    return toPolygon(toSATBoxPolygon(this, {}, angle));
  }

  dispatch<Return, Data>(b: ShapeBase, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return {
    return b.dispatchSquare(this, funcMap, _a, _b);
  }
  dispatchCircle<Return, Data>(a: Circle, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return { return funcMap.Circle.Square({shape: a, data: _a}, {shape: this, data: _b}); }
  dispatchSquare<Return, Data>(a: Box, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return { return funcMap.Square.Square({shape: this, data: _b}, {shape: a, data: _a}, true); }
  dispatchPolygon<Return, Data>(a: Polygon, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return { return funcMap.Square.Polygon({shape: this, data: _b}, {shape: a, data: _a}, true); }
}

export class Polygon extends ShapeBase {
  points: Vector2[];
  constructor(points: Vector2[]){
    super();
    this.points = points;
  }

  getAABB(angle: number): Box {
    return getAABB(toSATPolygon(this, {}, angle));
  }
  
  getRotated(angle: number): Polygon {
    return toPolygon(toSATPolygon(this, {}, angle));
  }

  dispatch<Return, Data>(b: ShapeBase, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return {
    return b.dispatchPolygon(this, funcMap, _a, _b);
  }
  dispatchCircle<Return, Data>(a: Circle, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return { return funcMap.Circle.Polygon({shape: a, data: _a}, {shape: this, data: _b}); }
  dispatchSquare<Return, Data>(a: Box, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return { return funcMap.Square.Polygon({shape: a, data: _a}, {shape: this, data: _b}); }
  dispatchPolygon<Return, Data>(a: Polygon, funcMap: DispatchFuncMap<Return, Data>, _a: Data, _b: Data): Return { return funcMap.Polygon.Polygon({shape: a, data: _a}, {shape: this, data: _b}); }
}


// abstract class Foo<T> {  
//   // Aがthis.  extends anyは何故か付けないとエラー
//   // https://github.com/microsoft/TypeScript/issues/30071
//   abstract foo<U extends any, B extends Array<U>>(b: B): U;
// }
// class Bar extends Foo<Bar> {
//   foo<U, B extends Array<U>>(b: B): U {
//     throw new Error("Method not implemented.");
//   }  
// }

// // example
// const c: ShapeBase = new Circle(1);
// const s: ShapeBase = new Box(1,2);
// if(c.hit({x:0,y:0}, 0, s, {x:0, y:0}, 0)){
//   console.log("hit");
// }
