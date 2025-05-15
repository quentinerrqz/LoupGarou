import { GeneralAction } from "../types";

export interface ITimedAction {
  typeName: "timedAction";
  id: string;
  created_at: number;
  countdown: number;
  action: GeneralAction;
} 

export class TimedActionRecord implements ITimedAction {
  typeName = "timedAction" as const;
  id: ITimedAction["id"];
  created_at: ITimedAction["created_at"];
  countdown: ITimedAction["countdown"];

  action: ITimedAction["action"];
  constructor({
    id,
    countdown,
    action,
  }: {
    id: ITimedAction["id"];
    countdown: ITimedAction["countdown"];
    action: ITimedAction["action"];
  }) {
    this.id = id;
    this.countdown = countdown;
    this.created_at = Date.now();
    this.action = action;
  }
}
