import React from "react";
import { game } from "./GameProvider";

type Props = {
  message: {
    id: string;
    content: string;
    sender: string;
    category: string;
  };
};
const ChatMessage = ({ message }: Props) => {
  const name = game?.players.find(
    (player) => player.id === message.sender
  )?.name;
  if (!name) {
    return <div>Ça bug !!!!!!!!!!!!!</div>; // or some fallback UI
  }
  const isCurrentUser = message.sender === game?.player.id;

  return (
    <>
      <strong>{isCurrentUser ? "You" : name}</strong>: {message.content}
    </>
  );
};

export default ChatMessage;
