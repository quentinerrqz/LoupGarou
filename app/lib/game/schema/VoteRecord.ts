import { IPlayer } from "./PlayerRecord";

export interface IVote {
  typeName: "vote";
  id: string;
  targetId: IPlayer["id"];
  by: IPlayer["id"];
  created_at: number;
}

export class VoteRecord implements IVote {
  typeName = "vote" as const;

  id: IVote["id"];
  targetId: IVote["targetId"];
  by: IVote["by"];
  created_at: number;
  constructor({
    id,
    targetId,
    by,
  }: {
    id: IVote["id"];
    targetId: IVote["targetId"];
    by: IVote["by"];
  }) {
    this.id = id;
    this.targetId = targetId;
    this.by = by;
    this.created_at = Date.now();
  }
}
