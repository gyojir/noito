import * as Core from '../core/core';

export class Vector2Util {
  static add(a: Core.Types.Math.Vector2Like, b: Core.Types.Math.Vector2Like): Core.Math.Vector2 {
    return new Core.Math.Vector2(a).add(new Core.Math.Vector2(b));
  }
  static sub(a: Core.Types.Math.Vector2Like, b: Core.Types.Math.Vector2Like): Core.Math.Vector2 {
    return new Core.Math.Vector2(a).subtract(new Core.Math.Vector2(b));
  }
  static mul(a: Core.Types.Math.Vector2Like, b: Core.Types.Math.Vector2Like): Core.Math.Vector2 {
    return new Core.Math.Vector2(a).multiply(new Core.Math.Vector2(b));
  }
  static scale(a: Core.Types.Math.Vector2Like, s: number): Core.Math.Vector2 {
    return new Core.Math.Vector2(a).scale(s);
  }
  static cross2d(a: Core.Types.Math.Vector2Like, b: Core.Types.Math.Vector2Like): number {
    return new Core.Math.Vector2(a).cross(new Core.Math.Vector2(b));
  }
  // 法線ベクトル
  static getNormal(a: Core.Types.Math.Vector2Like): Core.Math.Vector2 {
    const v = new Core.Math.Vector2(a);
    if(Math.abs(v.x) < Number.EPSILON && Math.abs(v.y) < Number.EPSILON) {
      return new Core.Math.Vector2(0, 1);
    }
    return new Core.Math.Vector2(-v.y, v.x);
  }
  static lerp(a: Core.Types.Math.Vector2Like, b: Core.Types.Math.Vector2Like, t: number): Core.Math.Vector2 {
    return new Core.Math.Vector2(a).lerp(new Core.Math.Vector2(b), t);
  }
}

export class CollisionUtil {
  static getIntersectionTime(l0: Core.Curves.Line, l1: Core.Curves.Line): number {
    const AC = Vector2Util.sub(l1.p0, l0.p0);
    const AB = Vector2Util.sub(l0.p1, l0.p0);
    const CD = Vector2Util.sub(l1.p1, l1.p0);
    const crossAB_CD = Vector2Util.cross2d(AB, CD);
    if (Math.abs(crossAB_CD) < Number.EPSILON) {
      // 平行状態
      return Number.MAX_VALUE;
    }

    const crossAC_AB = Vector2Util.cross2d(AC, AB);
    const crossAC_CD = Vector2Util.cross2d(AC, CD);
    const t1 = crossAC_CD / crossAB_CD;
    const t2 = crossAC_AB / crossAB_CD;
    if (t1 + Number.EPSILON < 0 || t1 - Number.EPSILON > 1 ||
      t2 + Number.EPSILON < 0 || t2 - Number.EPSILON > 1) {
      // 交差していない
      return Number.MAX_VALUE;
    }

    return t2;
  }

  static getIntersectionTimeMove(l: Core.Curves.Line, p: Core.Math.Vector2, mv: Core.Math.Vector2): number {
    const l0 = new Core.Curves.Line(l.p0, l.p1);
    const l1 = new Core.Curves.Line(p, Vector2Util.add(p, mv));
    return CollisionUtil.getIntersectionTime(l0, l1);
  }
  

  // 円と直線の距離を取得(半径以内なら当たっている)
  static getIntersectionCircleLine(tangent: Core.Types.Math.Vector2Like, lPos: Core.Types.Math.Vector2Like, radius: number, p: Core.Types.Math.Vector2Like, mv: Core.Types.Math.Vector2Like) {
    const a = new Core.Math.Vector2(lPos);
    const b = Vector2Util.add(a, new Core.Math.Vector2(tangent));
    const c = Vector2Util.add(p, mv);
    const ac = Vector2Util.sub(c, a);
    const ab = Vector2Util.sub(b, a);

    const cross = Vector2Util.cross2d(ab, ac);
    const d = cross / ab.length();
    return d;
  }

  // 円と線分の距離を取得(半径以内なら当たっている)
  static getIntersectionCircle(l: Core.Curves.Line, radius: number, p: Core.Types.Math.Vector2Like, mv: Core.Types.Math.Vector2Like) {
    const a = new Core.Math.Vector2(l.p0);
    const b = new Core.Math.Vector2(l.p1);
    const c = Vector2Util.add(p, mv);
    const ac = Vector2Util.sub(c, a);
    const bc = Vector2Util.sub(c, b);
    const ab = Vector2Util.sub(b, a);

    //スペシャルケース
    if (ac.dot(ab) * bc.dot(ab) > 0) {
      const lac = ac.length();
      const lbc = bc.length();
      return lac < lbc ? lac : lbc;
    }

    const cross = Vector2Util.cross2d(ab, ac);
    const d = cross / ab.length();
    return d;
  }

  static isIntersect(l0: Core.Curves.Line, l1: Core.Curves.Line): boolean {
    const t = CollisionUtil.getIntersectionTime(l0, l1);
    if (t + Number.EPSILON < 0 || t - Number.EPSILON > 1) {
      // 交差していない
      return false;
    }
    return true;
  }

  static isIntersectCircle(l: Core.Curves.Line, radius: number, p: Core.Types.Math.Vector2Like, mv: Core.Types.Math.Vector2Like) {
    const a = new Core.Math.Vector2(l.p0);
    const b = new Core.Math.Vector2(l.p1);
    const c = Vector2Util.add(p, mv);
    const ac = Vector2Util.sub(c, a);
    const bc = Vector2Util.sub(c, b);
    const ab = Vector2Util.sub(b, a);

    const cross = Vector2Util.cross2d(ab, ac);
    const d = cross / ab.length();
    if (Math.abs(d) > radius) {
      return false;
    }

    //スペシャルケース
    if (ac.dot(ab) * bc.dot(ab) > 0) {
      if (radius > ac.length() || radius > bc.length()) {
        return true;
      }
      return false;
    }

    return true;
  }

  // 壁にぶつかるベクトルを壁に沿わせる
  static restrictMove(l: Core.Curves.Line, v: Core.Types.Math.Vector2Like, p: Core.Types.Math.Vector2Like): Core.Math.Vector2 {
    const move = new Core.Math.Vector2(v);
    const pos = new Core.Math.Vector2(p);
    const t = CollisionUtil.getIntersectionTimeMove(l, pos, move);

    if (t < 0.0 || 1.0 < t) {
      return move;
    }

    // 交点から終点までのベクトル
    const penetration = Vector2Util.scale(move, 1 - t);

    const n = Vector2Util.getNormal(l.getTangent());
    // 法線の長さをtoleranceとのcosにする
    // n*(|d||n|cosθ/n^2) = n*|d|cosθ 垂直方向ベクトル * 大きさ
    n.scale(n.dot(penetration) / n.lengthSq());
    n.scale(1.3); //多めに戻す
    move.subtract(n);
    return move;
  }

  // 円を壁に沿わせる
  static restrictMoveCircle(l: Core.Curves.Line, radius: number, p: Core.Types.Math.Vector2Like, mv: Core.Types.Math.Vector2Like) {
    let vCopy = new Core.Math.Vector2(mv);
    let move = new Core.Math.Vector2(mv);
    let pos = new Core.Math.Vector2(p);
    const t = CollisionUtil.getIntersectionCircle(l, radius, pos, move);

    if (Math.abs(t) > radius) {
      return move;
    }
    
    //当たっていたら
    const n = Vector2Util.getNormal(l.getTangent()); // 法線
    n.scale((radius-t) / n.length()); // 侵入分を戻す
    n.scale(1.1); //多めに戻す
    move.add(n);

    // b垂線、a水平方向
    const a = new Core.Math.Vector2(l.p0);
    const b = new Core.Math.Vector2(l.p1);
    const c = Vector2Util.add(pos, move);
    const ac = Vector2Util.sub(c, a);
    const bc = Vector2Util.sub(c, b);
    const ab = Vector2Util.sub(b, a);

    //スペシャルケース
    if (ac.dot(ab) * bc.dot(ab) > 0) {
      // 始点か終点に当たっていたらずらす
      if (radius > ac.length() || radius > bc.length()) {
        const ac_or_bc = ac.length() < bc.length() ? ac : bc;
        const dot = vCopy.dot(ac_or_bc);

        vCopy.scale(dot / vCopy.lengthSq());
        vCopy = Vector2Util.sub(ac_or_bc, vCopy);

        //移動ベクトルとacかbcが同じになっていたら
        if (vCopy.length() < Number.EPSILON) {
          const rotate = new Core.Math.Matrix3;
          rotate.rotate(1 * Core.Math.DEG_TO_RAD);
          vCopy = ac_or_bc.transformMat3(rotate);
          vCopy = Vector2Util.sub(ac_or_bc, vCopy);
        }

        vCopy.scale(1 / vCopy.length());
        // vCopy.scale(0.05);
        move.set(vCopy.x, vCopy.y);
      }
    }

    return move;
  }

  // 壁にぶつかるベクトルを壁に沿わせる
  static restrictMovePlatform(platforms: Core.Curves.Line[], v: Core.Types.Math.Vector2Like, p: Core.Types.Math.Vector2Like): Core.Math.Vector2 {
    let move = new Core.Math.Vector2(v);
    let pos = new Core.Math.Vector2(p);

    // 第一ループ
    let t = Number.MAX_VALUE;
    let minI = -1;
    platforms.forEach((e, i) => {
      const tt = CollisionUtil.getIntersectionTimeMove(e, pos, move);
      if (tt < t) {
        t = tt;
        minI = i;
      }
    });
    // 当たった
    if (t >= 0 && t <= 1) {
      return CollisionUtil.restrictMove(platforms[minI], pos, move);
    }

    return move;
  }

  // 円を壁に沿わせる
  static restrictMoveCirclePlatform(platforms: Core.Curves.Line[], radius: number, p: Core.Types.Math.Vector2Like, v: Core.Types.Math.Vector2Like) {
    let move = new Core.Math.Vector2(v);
    let pos = new Core.Math.Vector2(p);
    let hit = false;

    let t = Number.MAX_VALUE;
    let minI = -1;
    platforms.forEach((e, i) => {
      const tt = CollisionUtil.getIntersectionCircle(e, radius, pos, move);
      if (Math.abs(tt) < t) {
        t = tt;
        minI = i;
      }
    })
    // 当たった
    if (Math.abs(t) <= radius) {
      move = CollisionUtil.restrictMoveCircle(platforms[minI], radius, pos, move);
    }

    // 第三ループ　当たっていたら止める
    t = Number.MAX_VALUE;
    minI = -1;
    platforms.forEach((e, i) => {
      if (CollisionUtil.isIntersectCircle(e, radius, pos, move)) {
        move.set(0, 0);
        return true;
      }
      return false;
    });

    return move;
  }
}
