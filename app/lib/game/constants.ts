import { Vec } from "../Vec";

const FPS = 60;
export const FRAME_LENGTH = 1000 / FPS;

export const MOVEMENT_PER_FRAME = 3; // pixels per frame

export const PLAYER_SIZE = 50;
export const CLICK_DISTANCE = PLAYER_SIZE * 2;

export const SERVER_TICK_LENGTH = 50;

const _WE_VECTOR = Vec.FromAngle(26 * (Math.PI / 180));
export const WE_VECTOR = _WE_VECTOR.toJson();
export const EW_VECTOR = _WE_VECTOR.clone().neg().toJson();

export const BORDER_VECTOR = Vec.FromAngle(-26 * (Math.PI / 180));

export const KeysDirection = {
  ArrowUp: Vec.FromAngle(-Math.PI / 2),
  ArrowDown: Vec.FromAngle(Math.PI / 2),
  ArrowLeft: Vec.FromAngle(Math.PI),
  ArrowRight: Vec.FromAngle(0),
};



export const MOVING_KEYS = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
