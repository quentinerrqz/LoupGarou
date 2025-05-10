import { Box } from "../lib/Box";
import { Vec } from "../lib/Vec";
import { KeysDirection, MOVEMENT_PER_FRAME } from "../lib/game/constants";
import { IPlayer } from "../lib/game/schema/PlayerRecord";
import { KeysState, PointerState } from "../lib/game/types";

export function getMovingUserPlayer(
  // screenSize:Box,
  frames: number,
  player: IPlayer,
  keys: KeysState
  // pointer: PointerState & { name: "dragging" }
): IPlayer {
  // Take into account the initial offset between the pointer and the player position

  const points = [];

  for (const key in keys) {
    if (keys[key as keyof KeysState]) {
      points.push(KeysDirection[key as keyof KeysState]);
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

  return {
    ...player,

    position: point
      ? Vec.Add(
          player.position,
          Vec.Mul(point.uni(), movementThisFrame)
        ).toJson()
      : player.position,
  };
}
