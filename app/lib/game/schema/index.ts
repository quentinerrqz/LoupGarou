import { IMessage, MessageRecord } from "./MessageRecord";
import { IParams, ParamsRecord } from "./ParamsRecord";
import { IPlayer, PlayerRecord } from "./PlayerRecord";
import { ITimedAction, TimedActionRecord } from "./timedActionRecord";
import { IVote, VoteRecord } from "./VoteRecord";
import { IWoodLog, WoodLogRecord } from "./WoodLogRecord";

export type GameRecord =
  | IPlayer
  | IWoodLog
  | IMessage
  | IParams
  | ITimedAction
  | IVote;

// Pas utilisé (compréhension de la structure de données)
export const gameSchema = {
  player: PlayerRecord,
  wood_log: WoodLogRecord,
  message: MessageRecord,
  params: ParamsRecord,
  timedAction: TimedActionRecord,
  vote: VoteRecord,
};
