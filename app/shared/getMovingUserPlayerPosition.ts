import { Box } from "../lib/Box";
import { Vec } from "../lib/Vec";
import {
  KeysDirection,
  MOVEMENT_PER_FRAME,
  OFFSET_TRIGGER_RADIUS,
} from "../lib/game/constants";
import { IPlayer } from "../lib/game/schema/PlayerRecord";
import { MovingKeysState, PointerState } from "../lib/game/types";
import { game } from "../ui/GameProvider";

export function getMovingUserPlayer(
  screenSize: Box,
  frames: number,
  player: IPlayer,
  keys: MovingKeysState
  // pointer: PointerState & { name: "dragging" }
): IPlayer {
  // Take into account the initial offset between the pointer and the player position

  const Directions = {
    Up: keys.ARROWUP || keys.W,
    Down: keys.ARROWDOWN || keys.S,
    Left: keys.ARROWLEFT || keys.A,
    Right: keys.ARROWRIGHT || keys.D,
  };

  const points = [];

  for (const key in Directions) {
    if (Directions[key as keyof typeof Directions]) {
      points.push(KeysDirection[key as keyof typeof KeysDirection]);
    }
  }

  let prePoint = points[0];

  for (let i = 0; i < points.length - 1; i++) {
    if (i + 1 > points.length - 1) break;
    prePoint = Vec.Add(prePoint, points[i + 1]);
  }

  // const { x, y, w, h } = screenSize;
  // point = new Vec(point.x - (x + w / 2), point.y - (y + h / 2));

  // If the player is already there, skip
  // if (Vec.Equals(point, player.position)) {
  //   return player;
  // }

  const movementThisFrame = MOVEMENT_PER_FRAME * frames;

  const { x, y } = prePoint;

  const newX = Math.abs(x) < 0.0001 ? 0 : x;
  const newY = Math.abs(y) < 0.0001 ? 0 : y;

  const point = new Vec(newX, newY);

  if (point.x === 0 && point.y === 0) return player;
  // If the player is close enough to the point, just snap to it
  // if (Vec.Dist(point, player.position) <= movementThisFrame) {
  //   return { ...player, position: point };
  // }

  const nextPosition = point
    ? Vec.Add(player.position, Vec.Mul(point.uni(), movementThisFrame)).toJson()
    : player.position;

  if (!game) return player;

  // const centerScreen = new Vec((screenSize.w / 2), (screenSize.h / 2));
  const centerScreen = new Vec(0, 0);
  const screenPosition = game.worldToScreen(
    new Vec(nextPosition.x, nextPosition.y)
  );
  const dist = Vec.Dist(centerScreen, screenPosition);

  if (dist > OFFSET_TRIGGER_RADIUS) {
    const distVec = Vec.Sub(screenPosition, centerScreen);
    const pointOnCircle = Vec.Add(
      centerScreen,
      Vec.Mul(distVec.uni(), OFFSET_TRIGGER_RADIUS)
    );
    const excess = Vec.Sub(screenPosition, pointOnCircle);
    game.screenSize = new Box(
      screenSize.x - excess.x,
      screenSize.y - excess.y,
      screenSize.w,
      screenSize.h
    );
  }

  return {
    ...player,

    position: nextPosition,
  };
}
