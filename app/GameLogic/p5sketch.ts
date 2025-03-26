"use client";

import p5Types from "p5";
import game, { sendToGame } from "../_Hooks/useGameRoom";

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
  let direction: string | null = null;
  p.setup = () => {
    cnv.w = parentRef.clientWidth;
    cnv.h = parentRef.clientHeight;
    const canvas = p.createCanvas(cnv.w, cnv.h);
    canvas.parent(parentRef);

    console.log("game sketch");
  };

  p.draw = () => {
    p.background(51);
    if (direction) {
      sendToGame({ type: "move", userId, direction });
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

  p.keyPressed = () => {
    if (p.keyCode === p.UP_ARROW) {
      direction = "up";
    } else if (p.keyCode === p.DOWN_ARROW) {
      direction = "down";
    } else if (p.keyCode === p.RIGHT_ARROW) {
      direction = "right";
    } else if (p.keyCode === p.LEFT_ARROW) {
      direction = "left";
    }
  };

  p.keyReleased = () => {
    direction = null;
  };

  p.windowResized = () => {
    cnv.w = parentRef.clientWidth;
    cnv.h = parentRef.clientHeight;
    p.resizeCanvas(cnv.w, cnv.h);
  };
};
