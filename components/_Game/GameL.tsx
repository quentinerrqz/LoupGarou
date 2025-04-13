"use client";
import { useGameRoom } from "@/app/_Hooks/useGameRoom";
import { Game } from "@/app/GameLogic/logic";
import React, { useMemo } from "react";
import P5SketchContainer from "./P5SketchContainer";
import { gameSketch } from "@/app/GameLogic/p5sketch";
import InterfaceL from "./InterfaceL";

type Props = {
  roomId: string;
  game: Game;
  userId: string;
};

const GameL = ({ roomId, game, userId }: Props) => {
  const { gameState, dispatch } = useGameRoom(roomId, game, userId);

  return (
    <div className="relative h-full w-full ">
      <P5SketchContainer gameSketch={gameSketch} userId={userId} />
      <InterfaceL gameState={gameState} dispatch={dispatch} userId={userId} />
    </div>
  );
};

export default GameL;
