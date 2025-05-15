import { GeneralAction } from "../types";
import { RoleRecordType } from "./RoleRecord";

export interface IParams {
  typeName: "params";
  id: string;
  page: "lobby" | "game" | "end";
  rolesSchema: "classic" | "custom";
  roles: RoleRecordType[];
  isDay: boolean;
  winner: "wolf" | "village" | "none" | null;
  actualGameAction: GeneralAction | null;
}

export class ParamsRecord implements IParams {
  typeName = "params" as const;
  id: IParams["id"];
  page: IParams["page"];
  rolesSchema: IParams["rolesSchema"] = "classic";
  roles: RoleRecordType[] = [];
  isDay: boolean ;
  winner: IParams["winner"] = null;
  actualGameAction: IParams["actualGameAction"] = null;

  constructor({
    id,
    page = "lobby",
    isDay = true,
  }: {
    id: IParams["id"];
    page?: IParams["page"];
    isDay?: IParams["isDay"];
  }) {
    this.id = id;
    this.page = page || "lobby";
    this.rolesSchema = "classic";
    this.roles = [];
    this.isDay = isDay || true;
    this.winner = null;
    this.actualGameAction = null;
  }
}
