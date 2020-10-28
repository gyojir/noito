import defaults from "defaults";

const DIRMODE = {
  'up&down': 0,
  'left&right': 1,
  '4dir': 2,
  '8dir': 3
};

const angleToDirections = function (angle: number, dirMode: number) {
  let out = {
    left: false,
    right: false,
    up: false,
    down: false,
  };

  angle = (angle + 360) % 360;
  switch (dirMode) {
    case 0: // up & down
      if (angle < 180) {
        out.down = true;
      } else {
        out.up = true;
      }
      break;

    case 1: // left & right
      if ((angle > 90) && (angle <= 270)) {
        out.left = true;
      } else {
        out.right = true;
      }
      break;

    case 2: // 4 dir
      if ((angle > 45) && (angle <= 135)) {
        out.down = true;
      } else if ((angle > 135) && (angle <= 225)) {
        out.left = true;
      } else if ((angle > 225) && (angle <= 315)) {
        out.up = true;
      } else {
        out.right = true;
      }
      break;

    case 3: // 8 dir
      if ((angle > 22.5) && (angle <= 67.5)) {
        out.down = true;
        out.right = true;
      } else if ((angle > 67.5) && (angle <= 112.5)) {
        out.down = true;
      } else if ((angle > 112.5) && (angle <= 157.5)) {
        out.down = true;
        out.left = true;
      } else if ((angle > 157.5) && (angle <= 202.5)) {
        out.left = true;
      } else if ((angle > 202.5) && (angle <= 247.5)) {
        out.left = true;
        out.up = true;
      } else if ((angle > 247.5) && (angle <= 292.5)) {
        out.up = true;
      } else if ((angle > 292.5) && (angle <= 337.5)) {
        out.up = true;
        out.right = true;
      } else {
        out.right = true;
      }
      break;
  }

  return out;
};

type PointerData = {
  down: boolean,
  justDown: boolean,
  justUp: boolean,
  downCount: number,
  dragged: boolean,
  velocity: { x: number, y: number },
  swipe: {
    left: boolean,
    right: boolean,
    up: boolean,
    down: boolean
  },
  swiped: boolean,
  lastswipe: {
    left: boolean,
    right: boolean,
    up: boolean,
    down: boolean
  },
  downPosition: {
    x: number,
    y: number,
  },
  position: {
    x: number,
    y: number
  },
  prevPosition: {
    x: number,
    y: number
  }
}

export class Pointer {
  delta: number = 1;
  data: PointerData = {
    down: false,
    justDown: false,
    justUp: false,
    downCount: 0,
    dragged: false,
    velocity: { x: 0, y: 0 },
    swipe: {
      left: false,
      right: false,
      up: false,
      down: false
    },
    swiped: false,
    lastswipe: {
      left: false,
      right: false,
      up: false,
      down: false
    },
    downPosition: {
      x: 0,
      y: 0,
    },
    position: {
      x: 0,
      y: 0
    },
    prevPosition: {
      x: 0,
      y: 0
    }
  };
  config: {
    velocityThreshold: number
  };

  constructor(config?: { velocityThreshold?: number }) {
    this.config = defaults(config, {
      velocityThreshold: 500
    });

    // イベント
    window.addEventListener('pointerdown', (ev) => {
      this.data.down = true;
      this.data.justDown = true;
      this.data.justUp = false;
      this.data.dragged = false;
      this.data.swiped = false;
      this.data.lastswipe = { left: false, right: false, up: false, down: false };
      this.data.downPosition.x = ev.x;
      this.data.downPosition.y = ev.y;
      this.data.position.x = ev.x;
      this.data.position.y = ev.y;
      this.data.prevPosition.x = this.data.position.x;
      this.data.prevPosition.y = this.data.position.y;
    });
    window.addEventListener('pointerup', () => {
      this.data.down = false;
      this.data.justDown = false;
      this.data.justUp = true;
      this.data.dragged = false;
      this.data.downPosition.x = 0;
      this.data.downPosition.y = 0;
    });
    window.addEventListener('pointermove', (ev) => {
      this.data.position.x = ev.x;
      this.data.position.y = ev.y;
      if (this.data.down) {
        this.data.dragged = this.data.dragged || (ev.x !== this.data.downPosition.x) || (ev.y !== this.data.downPosition.y);
        if (this.data.dragged &&
          this.getVelocity() > this.config.velocityThreshold) {
          this.data.swipe = angleToDirections(Phaser.Math.RadToDeg(this.getVelocityAngle()), DIRMODE["8dir"]);
          this.data.swiped = true;
          Object.assign(this.data.lastswipe, this.data.swipe);
        }
      }
    });
  }

  update(delta: number) {
    this.delta = delta;
    this.data.velocity = this.getVelocityVector();
  }

  postUpdate() {
    this.data.justDown = false;
    this.data.justUp = false;
    this.data.downCount = this.data.down ? this.data.downCount + 1 : 0;
    this.data.swipe = { left: false, right: false, up: false, down: false };
    this.data.prevPosition.x = this.data.position.x;
    this.data.prevPosition.y = this.data.position.y;
  }

  getVelocityVector() {
    const p1 = this.data.position;
    const p0 = this.data.prevPosition;
    const vel = new Phaser.Math.Vector2(p0.x, p0.y).subtract(new Phaser.Math.Vector2(p1.x, p1.y));
    vel.scale(1 / (this.delta * 0.001))
    return vel;
  }

  getVelocity() {
    const p1 = this.data.position;
    const p0 = this.data.prevPosition;
    const d = Phaser.Math.Distance.Between(p0.x, p0.y, p1.x, p1.y);
    const velocity = d / (this.delta * 0.001);
    return velocity;
  }
  getVelocityAngle() {
    const p1 = this.data.position;
    const p0 = this.data.prevPosition;
    const angle = Phaser.Math.Angle.Between(p0.x, p0.y, p1.x, p1.y);
    return angle;
  }

}
