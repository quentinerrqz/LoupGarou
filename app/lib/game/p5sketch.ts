"use client";

import { game } from "@/app/ui/GameProvider";
import p5Types from "p5";
import { Vec } from "../Vec";
import { Box } from "../Box";
import {
  CLICK_DISTANCE,
  FONCTIONAL_KEYS,
  OFFSET_TRIGGER_RADIUS,
} from "./constants";
import { GeneralAction } from "./types";
import { IPlayer } from "./schema/PlayerRecord";


// can go in "./types/global.d.ts"
type P5jsContainerRef = HTMLDivElement;
type P5jsSketch = (p: p5Types, parentRef: P5jsContainerRef) => void;

const canvasWidth: number = 0;
const canvasHeight: number = 0;

export const cnv = {
  h: canvasWidth,
  w: canvasHeight,
};

/// GENERAL FUNCTIONS ///////////////////////

export const gameSketch: P5jsSketch = (p, parentRef) => {
  p.setup = () => {
    cnv.w = parentRef.clientWidth;
    cnv.h = parentRef.clientHeight;
    const canvas = p.createCanvas(cnv.w, cnv.h);
    canvas.parent(parentRef);

    if (game) {
      const { x, y } = game.player.position;
      game.screenSize = new Box(-x, -y, innerWidth, innerHeight);
    }

    p.fill(255);
  };

  p.draw = () => {
    p.background(51);
    if (!game) return;

    const { x, y, w, h } = game.screenSize || { x: 0, y: 0, w: 0, h: 0 };

    const camerasDirectionToFollow = Vec.Sub(
      new Vec(x, y),
      game.cameraPosition
    );

    if (
      Vec.Dist(camerasDirectionToFollow, new Vec(0, 0)) < OFFSET_TRIGGER_RADIUS 
    ) {
      game.cameraPosition = new Vec(x, y);
    } else {
      game.cameraPosition = Vec.Add(
        game.cameraPosition,
        Vec.Mul(camerasDirectionToFollow, 0.07)
      );
    }

    drawPlayers();
    drawWoodLogs();

    drawExtraElements();
  };

  /// INPUT FUNCTIONS ///////////////////////

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

    if (e.key === "z") {
      const newScale = game.scale + 0.1;
      game.zoom(
        newScale,
        new Vec(game.player.position.x, game.player.position.y)
      );
    } else if (e.key === "h") {
      const newScale = game.scale - 0.1 > 0 ? game.scale - 0.1 : 0.1;
      game.zoom(
        newScale,
        new Vec(game.player.position.x, game.player.position.y)
      );
    }
    if (e.key === "e") {
      game.pointCameraOn(new Vec(p.mouseX, p.mouseY));
    }

    if (FONCTIONAL_KEYS.includes(e.key.toUpperCase())) {
      game.onKeyDown(e.key);
    }
  };

  p.keyReleased = (e: KeyboardEvent) => {
    if (!game) return;

    if (FONCTIONAL_KEYS.includes(e.key.toUpperCase())) {
      game.onKeyUp(e.key);
    }
  };

  /// RESIZE FUNCTION ///////////////////////

  p.windowResized = () => {
    cnv.w = parentRef.clientWidth;
    cnv.h = parentRef.clientHeight;
    const { x, y } = game?.screenSize || { x: 0, y: 0 };
    p.resizeCanvas(cnv.w, cnv.h);
    if (!game) return;
    game.screenSize = new Box(x, y, innerWidth, innerHeight);
  };

  /// UTILITY FUNCTIONS ///////////////////////

  function getAllPlayers({ exceptMe = false }: { exceptMe?: boolean }) {
    if (!game) return;
    const players = game.players;
    if (exceptMe) {
      return players.filter((p) => p.id !== game?.player.id);
    }
    return players;
  }

  function getAllAlivePlayers({ exceptMe = false }: { exceptMe?: boolean }) {
    if (!game) return;
    const isGameStarted = game.gameParams.page === "game";
    const players = game.players;
    const alivePlayers = isGameStarted
      ? players.filter((p) => p.role && p.role.isAlive)
      : players;
    if (exceptMe) {
      return alivePlayers.filter((p) => p.id !== game?.player.id);
    }
    return alivePlayers;
  }

  function getClosestPlayerFromPoint({
    point,
    isAlive = false,
    exceptMe = false,
  }: {
    point: Vec;
    isAlive?: boolean;
    exceptMe?: boolean;
  }) {
    if (!game) return;
    const players = isAlive
      ? getAllAlivePlayers({ exceptMe })
      : getAllPlayers({ exceptMe });
    if (players && players.length > 0) {
      const closestPlayer = players.reduce((prev, curr) => {
        return Vec.Dist(point, curr.position) < Vec.Dist(point, prev.position)
          ? curr
          : prev;
      });
      if (closestPlayer) {
        const dist = Vec.Dist(point, closestPlayer.position);

        return { closestPlayer, dist };
      }
    }
    return null;
  }

  function getClosestAlivePlayerFromMe() {
    if (!game) return;
    const { x, y } = game.player.position;
    const point = new Vec(x, y);
    const player =
      game.gameParams.page === "game"
        ? getClosestPlayerFromPoint({
            point: point,
            isAlive: true,
            exceptMe: true,
          })
        : getClosestPlayerFromPoint({
            point: point,
            exceptMe: true,
          });
    const { closestPlayer, dist } = player || {
      closestPlayer: null,
      dist: Infinity,
    };
    if (closestPlayer) {
      let newClosestPlayer: IPlayer | null = null;
      if (dist < 100) {
        newClosestPlayer = closestPlayer;
      }

      if (newClosestPlayer !== game.player.closestPlayer) {
        game.setCosestPlayer(newClosestPlayer);
      }
      return newClosestPlayer;
    }
    return null;
  }

  //// DRAW FUNCTIONS //////////////////////////////////

  function drawPlayers() {
    if (!game) return;

    const { w, h } = game.screenSize || { x: 0, y: 0, w: 0, h: 0 };
    const actualGameAction = game?.gameParams.actualGameAction as GeneralAction;

    const alivePlayers = getAllAlivePlayers({
      exceptMe: true,
    });
    const me = game.player;
    const votes = game.votes;
    const voteCounts: { [key: string]: number } = {};
    votes.forEach((vote) => {
      if (vote.targetId) {
        voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
      }
    });
    const scale = game.scale || 1;

    p.push();
    p.translate(w / 2, h / 2);
    if (alivePlayers) {
      for (const player of alivePlayers) {
        const voteCount = voteCounts[player.id] || 0;
        p.fill(255, 0, 0);
        p.ellipse(
          game.toVirtualX(player.position.x),
          game.toVirtualY(player.position.y),
          20 * scale,
          20 * scale
        );
        p.textAlign(p.CENTER);

        p.textSize(12);

        p.fill(255);
        if (voteCount > 0) {
          p.text(
            voteCount,
            game.toVirtualX(player.position.x),
            game.toVirtualY(player.position.y - 35)
          );
        }
        if (actualGameAction) {
          const whoIsActive =
            actualGameAction.name === "wake" ? actualGameAction.who : null;

          const condition2 = whoIsActive === "loup-garou";

          if (player.targetBy.length > 0 && condition2) {
            p.fill(255, 0, 0);
          }
        }

        p.text(
          player.name,
          game.toVirtualX(player.position.x),
          game.toVirtualY(player.position.y - 25)
        );
      }
    }

    if (me) {
      const voteCount = voteCounts[me.id] || 0;
      p.fill(0, 255, 0);
      p.ellipse(
        game.toVirtualX(me.position.x),
        game.toVirtualY(me.position.y),
        20 * scale,
        20 * scale
      );
      p.textAlign(p.CENTER);
      p.textSize(12);
      if (voteCount > 0) {
        p.text(
          voteCount,
          game.toVirtualX(me.position.x),
          game.toVirtualY(me.position.y - 35)
        );
      }
      if (me.role?.isAlive === false) {
        p.fill(255, 0, 255);
      } else {
        p.fill(0, 255, 0);
      }
      p.text(
        me.name,
        game.toVirtualX(me.position.x),
        game.toVirtualY(me.position.y - 25)
      );
    }
    p.pop();
  }

  function drawWoodLogs() {
    if (!game) return;
    const woodLogs = game.woodLogs;
    const { w, h } = game.screenSize || { w: 0, h: 0 };
    p.push();

    p.translate(w / 2, h / 2);
    if (woodLogs) {
      const { x, y } = game.screenSize || { x: 0, y: 0 };
      for (const woodLog of woodLogs) {
        woodLog.ownerId === null ? p.fill(0, 0, 255) : p.fill(255, 0, 255);
        p.ellipse(
          game.toVirtualX(woodLog.position.x),
          game.toVirtualY(woodLog.position.y),
          20 * game.scale,
          20 * game.scale
        );
      }
    }
    p.pop();
  }

  function drawExtraElements() {
    if (!game) return;

    const { w, h } = game.screenSize || { x: 0, y: 0, w: 0, h: 0 };
    const closest = getClosestAlivePlayerFromMe();
    if (closest) {
      const { x: cx, y: cy } = closest.position;
      p.push();
      p.translate(cnv.w / 2, cnv.h / 2);
      p.fill(0, 255, 0);
      p.ellipse(
        game.toVirtualX(cx),
        game.toVirtualY(cy),
        20 * game.scale,
        20 * game.scale
      );
      p.pop();
    }
    const worldX = (p.mouseX - w / 2) / game.scale;
    const worldY = (p.mouseY - h / 2) / game.scale;
    const closestFromMouse = getClosestPlayerFromPoint({
      point: game.screenToWorld(new Vec(worldX, worldY)),
      isAlive: game.gameParams.page === "game",
    });
    const { closestPlayer, dist } = closestFromMouse || {
      closestPlayer: null,
      dist: Infinity,
    };
    const { x: cpx, y: cpy } = closestPlayer?.position || { x: 0, y: 0 };
    if (closestPlayer && dist < CLICK_DISTANCE) {
      p.push();
      p.translate(cnv.w / 2, cnv.h / 2);
      p.stroke(255, 0, 0);
      p.strokeWeight(2);
      p.noFill();
      p.ellipse(
        game.toVirtualX(cpx),
        game.toVirtualY(cpy),
        20 * game.scale,
        20 * game.scale
      );
      p.pop();
    }
  }
};
