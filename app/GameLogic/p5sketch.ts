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
    console.log(game.players, game.users);
    player1 = new MyPlayer(userId, "Player", false, false, false);
  };

  p.draw = () => {
    p.background(51);
    game.players.forEach((player) => {
      const username = game.users.filter((user) => user.id === player.id)[0]
        .name;

      const startPosition = player.startPosition || { x: 0, y: 0 };
      const playerVelocity = player.velocity || 0;
      const playerAngle = player.dirangle || 0;
      const playerStartTime = player.startTime || Date.now();
      const pos = mru(
        player.ping || 0,
        startPosition.x,
        startPosition.y,
        playerVelocity,
        playerStartTime,
        playerAngle
      );
      if (player.id === player1.id) {
        player1.position = pos;
      }
      p.fill(255);
      p.beginShape();
      p.ellipse(pos.x, pos.y, 24, 24);
      p.text(username ?? "Unknown", pos.x, pos.y + 20);
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

function mru(
  ping: number,
  startX: number,
  startY: number,
  velocity: number,
  startTime: number,
  angle: number
) {
  const time = (Date.now() - startTime - ping) / 20; // Convert milliseconds to seconds
  const x = startX + velocity * Math.cos(angle) * time;
  const y = startY + velocity * Math.sin(angle) * time;
  return { x, y };
}
