import { VecModel } from "../../Vec";
import { PlayerTeam, PlayerState } from "../types";
import { IRole, RoleRecordType } from "./RoleRecord";
import { IVote } from "./VoteRecord";

export interface IPlayer {
  typeName: "player";
  id: string;
  name: string;
  created_at: number;
  team: PlayerTeam | null;
  role: RoleRecordType | null;
  state: PlayerState;
  position: VecModel;
  speed: number;
  isAdmin: boolean;
  isReady: boolean;
  loveIn: IPlayer["id"] | null;
  vote: IVote | null;
  voted: number;
  targetBy: IRole["name"][];
  closestPlayer: IPlayer | null;
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
  isAdmin: IPlayer["isAdmin"];
  isReady: IPlayer["isReady"];
  loveIn: IPlayer["loveIn"] | null;
  vote: IPlayer["vote"] | null;
  voted: IPlayer["voted"];
  targetBy: IPlayer["targetBy"] = [];
  closestPlayer: IPlayer["closestPlayer"] = null;

  constructor({
    id,
    name,
    position,
    state,
    team,
    isAdmin = true,
    loveIn = null,
    vote = null,
    voted = 0,
    targetBy = [],
  }: {
    id: IPlayer["id"];
    name: IPlayer["name"];
    position: VecModel | null;
    state?: PlayerState;
    team?: PlayerTeam | null;
    isAdmin?: boolean;
    loveIn?: IPlayer["loveIn"] | null;
    vote?: IPlayer["vote"] | null;
    voted: IPlayer["voted"];
    targetBy?: IPlayer["targetBy"] | null;
  }) {
    this.id = id;
    this.name = name;
    this.created_at = Date.now();
    this.team = team || null;
    this.role = null;
    this.state = state || { name: "idle" };
    this.position = position || { x: 0, y: 0 };
    this.speed = 1;
    this.isAdmin = isAdmin;
    this.isReady = false;
    this.loveIn = loveIn || null;
    this.vote = vote || null;
    this.voted = voted || 0;
    this.targetBy = targetBy || [];
    this.closestPlayer = null;
  }
}
