"use client";

import p5Types from "p5";
import game from "../_Hooks/useGameRoom";
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
  let player1: any;
  p.setup = () => {
    cnv.w = parentRef.clientWidth;
    cnv.h = parentRef.clientHeight;
    const canvas = p.createCanvas(cnv.w, cnv.h);
    canvas.parent(parentRef);
    console.log(game.players,game.users);
    player1 = new MyPlayer(userId, "Player", false, false, false);
    
  };

  p.draw = () => {
    p.background(51);

    if (player1) {
      player1.move();
      // player.draw(p);
    }
    game.players.forEach((player) => {
      const x = player.position?.x ?? 0;
      const y = player.position?.y ?? 0;
      p.fill(255);
      p.beginShape();
      p.ellipse(x, y, 24, 24);
      p.text(player.name ?? "Unknown", x, y);
      p.endShape();
    });
  };

  p.keyPressed = (e: KeyboardEvent) => {
    if (player1) {
      player1.keyPressed(e);
    }
  };

  p.keyReleased = (e: KeyboardEvent) => {
    if (player1) {
      player1.keyReleased(e);
    }
  };

  p.windowResized = () => {
    cnv.w = parentRef.clientWidth;
    cnv.h = parentRef.clientHeight;
    p.resizeCanvas(cnv.w, cnv.h);
  };
};
