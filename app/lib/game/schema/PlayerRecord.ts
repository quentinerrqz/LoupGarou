import { VecModel } from "../../Vec";
import { PlayerTeam, PlayerState } from "../types";

export interface IPlayer {
  typeName: "player";
  id: string;
  name: string;
  created_at: number;
  team: PlayerTeam | null;
  role: string | null;
  state: PlayerState;
  position: VecModel;
  speed: number;
}

export class PlayerRecord implements IPlayer {
  typeName = "player" as const;
  id: IPlayer["id"];
  name: IPlayer["name"];
  created_at: number;
  team: IPlayer["team"];
  role: IPlayer["role"];
  state: IPlayer["state"];
  position: IPlayer["position"];
  speed: IPlayer["speed"];

  constructor({
    id,
    name,
    position,
    state,
    team,
  }: {
    id: IPlayer["id"];
    name: IPlayer["name"];
    position: VecModel | null;
    state?: PlayerState;
    team?: PlayerTeam | null;
  }) {
    this.id = id;
    this.name = name;
    this.created_at = Date.now();
    this.team = team || null;
    this.role = null;
    this.state = state || { name: "idle" };
    this.position = position || { x: 0, y: 0 };
    this.speed = 1;
  }
}

// export class PlayerRecord = createRecordType<IPlayer>('player', {

// 	validator: {
// 		validate: (record) => {
// 			return record as IPlayer
// 		},
// 	},
// 	scope: 'document',
// }).withDefaultProperties(() => ({
// 	created_at: Date.now(),
// 	state: { name: 'idle' },
// 	health: 1,
// 	speed: 1,
// }))
