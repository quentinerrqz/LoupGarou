"use client";
import { useGameRoom } from "@/app/_Hooks/useGameRoom";
import { Game } from "@/app/GameLogic/logic";
import React from "react";
import P5SketchContainer from "./P5SketchContainer";
import { gameSketch } from "@/app/GameLogic/p5sketch";

type Props = {
    roomId: string;
    game: Game;
    userId: string;
};

const GameL = ({roomId,game,userId}:Props) => {
    const { gameState, dispatch } = useGameRoom(roomId, game, userId);
    const username = gameState.users.find((user) => user.id === userId)?.name;
  return (
    <div className="relative h-full w-full ">
        <P5SketchContainer gameSketch={gameSketch} userId={userId} />
        <div className=" absolute top-0 left-0 h-full w-full flex justify-center font-bold text-white">{username}</div>
    </div>
  );
};

export default GameL;
