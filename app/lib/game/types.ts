import { Vec, VecModel } from "../Vec";
import { IPlayer } from "./schema/PlayerRecord";
import { GameRecord } from "./schema";
import { IRole, RoleRecordType } from "./schema/RoleRecord";

export type PlayerTeam = "village" | "wolf";
export type ChatCategory = "all" | "lover" | "wolf" | "dead";
export type PlayerState =
  | { name: "idle" }
  | { name: "moving"; direction?: Vec }
  | { name: "vote"; targetId: IPlayer["id"] }
  | { name: "voted"; targetId: IPlayer["id"] }
  | { name: "die" }
  | { name: "revenge" }
  | { name: "sleeping" }
  | { name: "waiting" };

// | { name: 'aiming'; power: number; maxPower: number }
// | { name: 'throwing'; recovery: number }
// | { name: 'hit'; recovery: number }

// export type RolePower = {
//   description: string;
// } | null;

export interface IPower {
  sorcière: {
    potions: {
      heal: number;
      poison: number;
    };
  };
  "loup-garou": {};
  chasseur: {};
  cupidon: {};
  voyante: {};
  "petite-fille": {};
  villageois: {};
}

export type GeneralAction =
  | { name: "start" }
  | { name: "sleep"; who: IRole["name"] | "amoureux" | "all" }
  | { name: "wake"; who: IRole["name"] | "amoureux" | "all" }
  | { name: "happeningBegin"; who: "chasseur" }
  | { name: "happeningEnd"; who: "chasseur" }
  | { name: "voteBegin" }
  | { name: "voteEnd" }
  | { name: "end" }
  | { name: "return lobby" };

export type GameInputs = {
  pointer: PointerState;
  keys: KeysState;
};

export type KeysState = {
  ArrowUp: boolean;
  ArrowDown: boolean;
  ArrowLeft: boolean;
  ArrowRight: boolean;
  // attack: boolean;
  // vote: boolean;
};

export type PointerState =
  | {
      name: "up";
      point: Vec;
    }
  | {
      name: "down";
      point: Vec;
      downPoint: Vec;
    }
  | {
      name: "dragging";
      point: Vec;
      downPoint: Vec;
      offset: Vec;
    };

export type ServerToClientMessage =
  | {
      type: "pong";
      clientId: "server";
      clock: number;
    }
  | {
      type: "init";
      clientId: "server";
      clock: number;
      snapshot: {
        store: StoreSnapshot<GameRecord>;
        // schema: SerializedSchema
      };
    }
  | {
      type: "recovery";
      clientId: "server";
      clock: number;
      snapshot: {
        store: StoreSnapshot<GameRecord>;
        // schema: SerializedSchema
      };
    }
  | {
      type: "update";
      clientId: "server";
      clock: number;
      updates: ClientUpdateFromServer[];
    };

export type ClientUpdateFromServer = {
  clientId: IPlayer["id"] | "server";
  updates: HistoryEntry<GameRecord>[];
};

export type ClientToServerMessage =
  | {
      type: "ping";
      clientId: IPlayer["id"];
      clock: number;
    }
  | {
      type: "recovery";
      clientId: IPlayer["id"];
      clock: number;
    }
  | {
      type: "update";
      clientId: IPlayer["id"];
      clock: number;
      updates: HistoryEntry<GameRecord>[];
    };

export type ServerRecord<T extends GameRecord = GameRecord> =
  | {
      clock: number;
      record: Readonly<T>;
    }
  | {
      clock: number;
      record: null;
    };

export type HistoryEntry<T extends GameRecord = GameRecord> = {
  changes: {
    added: Record<T["id"], T>;
    updated: Record<T["id"], [T, T]>;
    removed: Record<T["id"], T>;
  };
  source: "user" | "remote";
};

export type RecordId<T extends GameRecord = GameRecord> = T["id"];

export type StoreSnapshot<T extends GameRecord = GameRecord> = {
  [id: string]: {
    clock: number;
    record: Readonly<T> | null;
  };
};
