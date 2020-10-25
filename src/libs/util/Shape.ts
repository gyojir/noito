import SAT from "sat";
import * as Core from '../core/core';

// example
// const c: ShapeBase = new Circle(1);
// const s: ShapeBase = new Square(1,2);
// if(c.hit({x:0,y:0}, s, {x:0, y:0})){
//   console.log("hit");
// }

type Vector2 = Core.Types.Math.Vector2Like;

function toSATCircle(c: Circle, pos: Vector2){
  return  new SAT.Circle(new SAT.Vector(pos.x, pos.y), c.radius);
}
function toSATBoxPolygon(c: Box, pos: Vector2, angle: number){
  // const s = new SAT.Box(new SAT.Vector(pos.x, pos.y), c.width, c.height).toPolygon();
  const s = new SAT.Box(new SAT.Vector(pos.x, pos.y), c.width, c.height).toPolygon();
  return applyPolygonOffset(s, angle, - c.width / 2, - c.height / 2);
}
function toSATPolygon(c: Polygon, pos: Vector2, angle: number){
  const s = new SAT.Polygon(new SAT.Vector(pos.x, pos.y), c.points.map(e=>new SAT.Vector(e.x, e.y)));
  return applyPolygonOffset(s, angle);
}


function toCircle(c: SAT.Circle){
  return new Circle(c.r);
}
function toBox(c: SAT.Box){
  return new Box(c.w, c.h);
}
function toPolygon(c: SAT.Polygon){
  return new Polygon(c.points.map(e=> ({x: e.x, y: e.y})));
}

function getAABB(p: SAT.Polygon){
  const aabb = p.getAABB();
  applyPolygonOffset(aabb, 0);
  return new Box(aabb.points[0].x * 2, aabb.points[0].y * 2);
}

function applyPolygonOffset(p: SAT.Polygon, angle: number, xoffset: number = 0, yoffset:number = 0){
  p.points.forEach(e=> { e.x += xoffset; e.y += yoffset });
  p.rotate(angle);
  p.setPoints(p.points.map(e=> new SAT.Vector(e.x + p.pos.x, e.y + p.pos.y)));
  p.pos.x = 0;
  p.pos.y = 0;
  return p;
}

type Arg<T extends Shape<T>> = {
  shape: T,
  [key: string]: any
}

type DispatchFunc<Return, A, B> = (a: A, b: B) => Return;
type DispatchFuncMap<Return> = {
  Circle : {
    Circle: DispatchFunc<Return, Arg<Circle>, Arg<Circle>>,
    Square: DispatchFunc<Return, Arg<Circle>, Arg<Box>>,
    Polygon: DispatchFunc<Return, Arg<Circle>, Arg<Polygon>>
  },
  Square: {
    Square: DispatchFunc<Return, Arg<Box>, Arg<Box>>,
    Polygon: DispatchFunc<Return, Arg<Box>, Arg<Polygon>>
  },
  Polygon: {
    Polygon: DispatchFunc<Return, Arg<Polygon>, Arg<Polygon>>
  }
}

const hitFunc = {
  Circle : {
    Circle: function (a: {shape: Circle, pos: Vector2}, b: {shape: Circle, pos: Vector2}): boolean {
      const sa = toSATCircle(a.shape, a.pos);
      const sb = toSATCircle(b.shape, b.pos);
      return SAT.testCircleCircle(sa, sb);
    },
    Square: function (a: {shape: Circle, pos: Vector2}, b: {shape: Box, pos: Vector2, angle: number}): boolean {
      const sa = toSATCircle(a.shape, a.pos);
      const sb = toSATBoxPolygon(b.shape, b.pos, b.angle);
      return SAT.testCirclePolygon(sa, sb);
    },
    Polygon: function (a: {shape: Circle, pos: Vector2}, b: {shape: Polygon, pos: Vector2, angle: number}): boolean {
      const sa = toSATCircle(a.shape, a.pos);
      const sb = toSATPolygon(b.shape, b.pos, b.angle);
      return SAT.testCirclePolygon(sa, sb);
    }
  },
  Square: {
    Square: function (a: {shape: Box, pos: Vector2, angle: number}, b: {shape: Box, pos: Vector2, angle: number}): boolean {
      const sa = toSATBoxPolygon(a.shape, a.pos, a.angle);
      const sb = toSATBoxPolygon(b.shape, b.pos, b.angle);
      return SAT.testPolygonPolygon(sa, sb);
    },
    Polygon: function (a: {shape: Box, pos: Vector2, angle: number}, b: {shape: Polygon, pos: Vector2, angle: number}): boolean {
      const sa = toSATBoxPolygon(a.shape, a.pos, a.angle);
      const sb = toSATPolygon(b.shape, b.pos, b.angle);
      return SAT.testPolygonPolygon(sa, sb);
    }
  },
  Polygon: {
    Polygon: function (a: {shape: Polygon, pos: Vector2, angle: number}, b: {shape: Polygon, pos: Vector2, angle: number}): boolean {
      const sa = toSATPolygon(a.shape, a.pos, a.angle);
      const sb = toSATPolygon(b.shape, b.pos, b.angle);
      return SAT.testPolygonPolygon(sa, sb);
    }
  }
};


export abstract class ShapeBase {
  abstract hit(aPos: Vector2, aAngle: number, b: ShapeBase, bPos: Vector2, bAngle: number) : boolean;

  abstract getAABB(angle: number): Box;
}

export abstract class Shape<T extends Shape<T>> extends ShapeBase{
  hit(aPos: Vector2, aAngle: number, b: Shape<any>, bPos: Vector2, bAngle: number) : boolean {
    return this.dispatch(b, hitFunc, {shape: this as any, pos: aPos, angle: aAngle}, {shape: b, pos: bPos, angle: bAngle});
  }
  
  // Aがthis
  abstract dispatch<Return, B extends Shape<any>>(b: B, funcMap: DispatchFuncMap<Return>, _a: Arg<T>, _b: Arg<B>): Return;
  // Bがthis
  abstract dispatchCircle<Return>(funcMap: DispatchFuncMap<Return>, _a: Arg<Circle>, _b: Arg<T>): Return;
  abstract dispatchSquare<Return>(funcMap: DispatchFuncMap<Return>, _a: Arg<Box>, _b: Arg<T>): Return;
  abstract dispatchPolygon<Return>(funcMap: DispatchFuncMap<Return>, _a: Arg<Polygon>, _b: Arg<T>): Return;
}

export class Circle extends Shape<Circle> {
  radius: number;
  constructor(radius: number){
    super();
    this.radius = radius;
  }

  getAABB(angle: number): Box {
    return new Box(this.radius*2, this.radius*2);
  }

  dispatch<Return>(b: Shape<any>, funcMap: DispatchFuncMap<Return>, _a: Arg<Circle>, _b: Arg<any>): Return {
    return b.dispatchCircle(funcMap, _a, _b);
  }
  dispatchCircle<Return>(funcMap: DispatchFuncMap<Return>, _a: Arg<Circle>, _b: Arg<Circle>): Return { return funcMap.Circle.Circle(_b, _a); }
  dispatchSquare<Return>(funcMap: DispatchFuncMap<Return>, _a: Arg<Box>, _b: Arg<Circle>): Return { return funcMap.Circle.Square(_b, _a); }
  dispatchPolygon<Return>(funcMap: DispatchFuncMap<Return>, _a: Arg<Polygon>, _b: Arg<Circle>): Return { return funcMap.Circle.Polygon(_b,_a); }
}

export class Box extends Shape<Box> {
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

  dispatch<Return>(b: Shape<any>, funcMap: DispatchFuncMap<Return>, _a: Arg<Box>, _b: Arg<any>): Return {
    return b.dispatchSquare(funcMap, _a, _b);
  }
  dispatchCircle<Return>(funcMap: DispatchFuncMap<Return>, _a: Arg<Circle>, _b: Arg<Box>): Return { return funcMap.Circle.Square(_a, _b); }
  dispatchSquare<Return>(funcMap: DispatchFuncMap<Return>, _a: Arg<Box>, _b: Arg<Box>): Return { return funcMap.Square.Square(_a, _b); }
  dispatchPolygon<Return>(funcMap: DispatchFuncMap<Return>, _a: Arg<Polygon>, _b: Arg<Box>): Return { return funcMap.Square.Polygon(_b, _a); }
}

export class Polygon extends Shape<Polygon> {
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

  dispatch<Return>(b: Shape<any>, funcMap: DispatchFuncMap<Return>, _a: Arg<Polygon>, _b: Arg<any>): Return {
    return b.dispatchPolygon(funcMap, _a, _b);
  }
  dispatchCircle<Return>(funcMap: DispatchFuncMap<Return>, _a: Arg<Circle>, _b: Arg<Polygon>): Return { return funcMap.Circle.Polygon(_a, _b); }
  dispatchSquare<Return>(funcMap: DispatchFuncMap<Return>, _a: Arg<Box>, _b: Arg<Polygon>): Return { return funcMap.Square.Polygon(_a, _b); }
  dispatchPolygon<Return>(funcMap: DispatchFuncMap<Return>, _a: Arg<Polygon>, _b: Arg<Polygon>): Return { return funcMap.Polygon.Polygon(_a, _b); }
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