"use client";

import { game } from "@/app/ui/GameProvider";
import p5Types from "p5";
import { Vec } from "../Vec";
import { Box } from "../Box";
import { MOVING_KEYS } from "./constants";

// can go in "./types/global.d.ts"
type P5jsContainerRef = HTMLDivElement;
type P5jsSketch = (p: p5Types, parentRef: P5jsContainerRef) => void;

const canvasWidth: number = 0;
const canvasHeight: number = 0;

export const cnv = {
  h: canvasWidth,
  w: canvasHeight,
};

export const gameSketch: P5jsSketch = (p, parentRef) => {
  p.setup = () => {
    cnv.w = parentRef.clientWidth;
    cnv.h = parentRef.clientHeight;
    const canvas = p.createCanvas(cnv.w, cnv.h);
    canvas.parent(parentRef);
    p.fill(255);
  };

  p.draw = () => {
    p.background(51);
    if (!game) return;
    const players = game.players;
    if (players) {
      for (const player of players) {
        p.push();
        p.translate(cnv.w / 2, cnv.h / 2);
        p.fill(255, 0, 0);
        p.ellipse(player.position.x, player.position.y, 20, 20);
        p.pop();
        p.push();
      }
    }
  };

  p.mouseMoved = (e: MouseEvent) => {
    if (!game) return;
    game.onPointerMove(game.screenToWorld(new Vec(e.clientX, e.clientY)));
  };

  p.mouseDragged = (e: MouseEvent) => {
    if (!game) return;
    game.onPointerMove(game.screenToWorld(new Vec(e.clientX, e.clientY)));
  };

  p.mousePressed = (e: MouseEvent) => {
    if (!game) return;
    game.onPointerMove(game.screenToWorld(new Vec(e.clientX, e.clientY)));
    game.onPointerDown();
  };

  p.mouseReleased = (e: MouseEvent) => {
    if (!game) return;
    game.onPointerMove(game.screenToWorld(new Vec(e.clientX, e.clientY)));
    game.onPointerUp();
  };

  p.keyPressed = (e: KeyboardEvent) => {

    if (!game) return;
    if(MOVING_KEYS.includes(e.key)){
      game.onKeyDown(e.key)
    }
   
    // game.onKeyDown;
  };

  p.keyReleased = (e: KeyboardEvent) => {
    if (!game) return;
    if(MOVING_KEYS.includes(e.key)){
      game.onKeyUp(e.key)
    }
  };

  p.windowResized = () => {
    cnv.w = parentRef.clientWidth;
    cnv.h = parentRef.clientHeight;
    p.resizeCanvas(cnv.w, cnv.h);
    if (!game) return;
    game.screenSize = new Box(0, 0, innerWidth, innerHeight);
  };
};
