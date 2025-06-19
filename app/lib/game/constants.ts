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

export const OFFSET_TRIGGER_RADIUS = 140; // pixels

export const KeysDirection = {
  Up: Vec.FromAngle(-Math.PI / 2),
  Down: Vec.FromAngle(Math.PI / 2),
  Left: Vec.FromAngle(Math.PI),
  Right: Vec.FromAngle(0),
};

export const MOVING_KEYS = [
  "ARROWDOWN",
  "ARROWUP",
  "ARROWLEFT",
  "ARROWRIGHT",
  "W",
  "A",
  "S",
  "D",
];
export const MOVING_KEYS_UP = ["ARROWUP", "W"];
export const MOVING_KEYS_DOWN = ["ARROWDOWN", "S"];
export const MOVING_KEYS_LEFT = ["ARROWLEFT", "A"];
export const MOVING_KEYS_RIGHT = ["ARROWRIGHT", "D"];
export const FONCTIONAL_KEYS = [
  "ARROWDOWN",
  "ARROWUP",
  "ARROWLEFT",
  "ARROWRIGHT",
  "W",
  "A",
  "S",
  "D",
];

export const TOUR_DE_PREPARATION = ["cupidon", "amoureux"];

// export const TOUR_NORMAL = ["voyante", "loup-garou", "sorcière", "all"];
export const TOUR_NORMAL = ["voyante", "loup-garou", "sorcière"];

export const TEMPS_PAR_JOUEUR = 10; // seconds
export const TEMPS_PAR_JOUEUR_MS = TEMPS_PAR_JOUEUR * 1000; // seconds

export const TEMPS_DE_VOTE = 20; // seconds
export const TEMPS_DE_VOTE_MS = TEMPS_DE_VOTE * 1000; // seconds
