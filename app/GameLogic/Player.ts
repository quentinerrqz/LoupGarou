import { sendToGame } from "../_Hooks/useGameRoom";

export class Player {
  id: string;
  name: string;
  isReady: boolean;
  isSpectator: boolean;
  isAdmin: boolean;
  position: { x: number; y: number } | undefined;
  //   draw: (p: any) => void;

  constructor(
    id: string,
    name: string,
    isReady = false,
    isSpectator = false,
    isAdmin = false
  ) {
    this.id = id;
    this.name = name;
    this.isReady = isReady;
    this.isSpectator = isSpectator;
    this.isAdmin = isAdmin;
    this.position = { x: 0, y: 0 };
  }
}

export class MyPlayer extends Player {
  NSEW: { N: number; S: number; E: number; W: number; NS: number; EW: number };
  constructor(
    id: string,
    name: string,
    isReady = false,
    isSpectator = false,
    isAdmin = false
  ) {
    super(id, name, isReady, isSpectator, isAdmin);
    this.NSEW = {
      N: 0,
      S: 0,
      E: 0,
      W: 0,
      NS: 0,
      EW: 0,
    };
  }

  keyPressed = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      this.NSEW.N = -1;
      this.NSEW.NS = -1;
    }
    if (e.key === "ArrowDown") {
      this.NSEW.S = 1;
      this.NSEW.NS = 1;
    }
    if (e.key === "ArrowRight") {
      this.NSEW.E = 1;
      this.NSEW.EW = 1;
    }
    if (e.key === "ArrowLeft") {
      this.NSEW.W = -1;
      this.NSEW.EW = -1;
    }
  };

  keyReleased = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      this.NSEW.N = 0;
      this.NSEW.NS = this.NSEW.S;
    }
    if (e.key === "ArrowDown") {
      this.NSEW.S = 0;
      this.NSEW.NS = this.NSEW.N;
    }
    if (e.key === "ArrowRight") {
      this.NSEW.E = 0;
      this.NSEW.EW = this.NSEW.W;
    }
    if (e.key === "ArrowLeft") {
      this.NSEW.W = 0;
      this.NSEW.EW = this.NSEW.E;
    }
  };
  move = () => {
    if (this.NSEW.NS !== 0 || this.NSEW.EW !== 0) {
      const angle = Math.atan2(this.NSEW.NS, this.NSEW.EW) * (180 / Math.PI);
      console.log("angle", angle);
      sendToGame({ type: "move", userId: this.id, dirAngle: angle });
    }
  };
}
