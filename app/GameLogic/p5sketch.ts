"use client";

import p5Types from "p5";
import game, { sendToGame } from "../_Hooks/useGameRoom";
import { MyPlayer, Player } from "./Player";

// can go in "./types/global.d.ts"
type P5jsContainerRef = HTMLDivElement;
type P5jsSketch = (
  p: p5Types,
  parentRef: P5jsContainerRef,
  userId: string
) => void;

const canvasWidth: number = 0;
const canvasHeight: number = 0;

export const cnv = {
  h: canvasWidth,
  w: canvasHeight,
};

export const gameSketch: P5jsSketch = (p, parentRef, userId) => {
  let player: any;
  p.setup = () => {
    cnv.w = parentRef.clientWidth;
    cnv.h = parentRef.clientHeight;
    const canvas = p.createCanvas(cnv.w, cnv.h);
    canvas.parent(parentRef);

    player = new MyPlayer(userId, "Player", false, false, false);
    console.log("game sketch");
  };

  p.draw = () => {
    p.background(51);

    if (player) {
      player.move();
      // player.draw(p);
    }
    game.users.forEach((user) => {
      const x = user.position?.x ?? 0;
      const y = user.position?.y ?? 0;
      p.fill(255);
      p.beginShape();
      p.ellipse(x, y, 24, 24);
      p.text(user.name ?? "Unknown", x, y);
      p.endShape();
    });
  };

  p.keyPressed = (e: KeyboardEvent) => {
    if (player) {
      player.keyPressed(e);
    }
  };

  p.keyReleased = (e: KeyboardEvent) => {
    if (player) {
      player.keyReleased(e);
    }
  };

  p.windowResized = () => {
    cnv.w = parentRef.clientWidth;
    cnv.h = parentRef.clientHeight;
    p.resizeCanvas(cnv.w, cnv.h);
  };
};
