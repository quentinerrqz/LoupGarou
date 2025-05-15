"use client";

import { game } from "@/app/ui/GameProvider";
import p5Types from "p5";
import { Vec } from "../Vec";
import { Box } from "../Box";
import { MOVING_KEYS } from "./constants";
import { GeneralAction } from "./types";

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
    drawPlayers();
    drawWoodLogs();

    const closest = getClosestPlayer();
    if (closest) {
      p.push();
      p.translate(cnv.w / 2, cnv.h / 2);
      p.fill(0, 255, 0);
      p.ellipse(closest.position.x, closest.position.y, 20, 20);
      p.pop();
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
    if (MOVING_KEYS.includes(e.key)) {
      game.onKeyDown(e.key);
    }

    // game.onKeyDown;
  };

  p.keyReleased = (e: KeyboardEvent) => {
    if (!game) return;
    if (MOVING_KEYS.includes(e.key)) {
      game.onKeyUp(e.key);
    }
  };

  p.windowResized = () => {
    cnv.w = parentRef.clientWidth;
    cnv.h = parentRef.clientHeight;
    p.resizeCanvas(cnv.w, cnv.h);
    if (!game) return;
    game.screenSize = new Box(0, 0, innerWidth, innerHeight);
  };

  function drawPlayers() {
    if (!game) return;
    const actualGameAction = game?.gameParams.actualGameAction as GeneralAction;
    const players = game.players.filter((p) => p.id !== game?.player.id);
    const alivePlayers = players.filter(
      (p) => (p.role && p.role.isAlive) || !p.role
    );
    const me = game.player;
    if (players) {
      for (const player of alivePlayers) {
        p.push();
        p.translate(cnv.w / 2, cnv.h / 2);

        p.fill(255, 0, 0);
        p.ellipse(player.position.x, player.position.y, 20, 20);
        p.textAlign(p.CENTER);

        p.textSize(12);

        p.fill(255);

        if (actualGameAction) {
          const whoIsActive =
            actualGameAction.name === "wake" ? actualGameAction.who : null;

          const condition2 = whoIsActive === "loup-garou";

          if (player.targetBy.length > 0 && condition2) {
            p.fill(255, 0, 0);
          }
        }

        p.text(player.name, player.position.x, player.position.y - 25);
        p.pop();
        p.push();
      }
    }

    if (me) {
      p.push();
      p.translate(cnv.w / 2, cnv.h / 2);
      p.fill(0, 255, 0);
      p.ellipse(me.position.x, me.position.y, 20, 20);
      p.textAlign(p.CENTER);
      p.textSize(12);
      if (me.role?.isAlive === false) {
        p.fill(255, 0, 255);
      } else {
        p.fill(0, 255, 0);
      }
      p.text(me.name, me.position.x, me.position.y - 25);
      p.pop();
    }
  }
  function getClosestPlayer() {
    if (!game) return;
    const player1 = game.player;
    const players = game.players.filter((p) => p.id !== player1.id);
    if (players.length > 0) {
      const closestPlayer = players.reduce((prev, curr) => {
        return game && game.player
          ? Vec.Dist(curr.position, game.player.position) <
            Vec.Dist(prev.position, game.player.position)
            ? curr
            : prev
          : prev;
      });

      if (!closestPlayer) return null;
      const dist = Vec.Dist(game.player.position, closestPlayer.position);

      if (dist < 100) {
        game.setCosestPlayer(closestPlayer);
      } else {
        game.setCosestPlayer(null);
      }
      return dist < 100 ? closestPlayer : null;
    }
  }
  function drawWoodLogs() {
    if (!game) return;
    const woodLogs = game.woodLogs;
    if (woodLogs) {
      for (const woodLog of woodLogs) {
        p.push();
        p.translate(cnv.w / 2, cnv.h / 2);
        woodLog.ownerId === null ? p.fill(0, 0, 255) : p.fill(255, 0, 255);
        p.ellipse(woodLog.position.x, woodLog.position.y, 20, 20);
        p.pop();
      }
    }
  }
};
