import { ChatCategory } from "../types";
import { IPlayer } from "./PlayerRecord";

export interface IMessage {
  typeName: "message";
  id: string;
  content: string;
  created_at: number;
  sender: IPlayer["id"] | "server";
  category: ChatCategory;
}

export class MessageRecord implements IMessage {
  typeName = "message" as const;
  id: IMessage["id"];
  content: IMessage["content"];
  created_at: number;
  sender: IMessage["sender"];
  category: IMessage["category"];
  constructor({
    id,
    content,
    sender,
    category = "all",
  }: {
    id: IMessage["id"];

    content: IMessage["content"];
    sender: IPlayer["id"] | "server";
    category?: IMessage["category"];
  }) {
    this.id = id;
    this.content = content;
    this.created_at = Date.now();
    this.sender = sender;
    this.category = category;
  }
}
