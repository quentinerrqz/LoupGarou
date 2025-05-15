import { VecModel } from "../../Vec";
import { IPlayer } from "./PlayerRecord";

export interface IWoodLog {
  typeName: "wood_log";
  id: string;
  ownerId: IPlayer["id"] | null;
  created_at: number;
  position: VecModel;
}

export class WoodLogRecord implements IWoodLog {
  typeName = "wood_log" as const;
  id: IWoodLog["id"];
  ownerId: IWoodLog["ownerId"] | null;
  created_at: number;
  position: IWoodLog["position"];

  constructor({
    id,
    position,
    ownerId = null,
  }: {
    id: IWoodLog["id"];
    position: VecModel | null;
    ownerId?: IWoodLog["ownerId"];
  }) {
    this.id = id;
    this.created_at = Date.now();
    this.ownerId = ownerId || null;
    this.position = position || { x: 0, y: 0 };
  }
}
