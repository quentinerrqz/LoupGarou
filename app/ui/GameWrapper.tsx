"use client";
import React from "react";

import { useTicker } from "../_Hooks/useTicker";

import P5SketchContainer from "@/app/ui/P5SketchContainer";
import { gameSketch } from "../lib/game/p5sketch";
import GameInterface from "./GameInterface";

const GameWrapper = () => {
  useTicker();

  return (
    <div className="h-full w-full">
      <P5SketchContainer gameSketch={gameSketch} />
      <GameInterface />
    </div>
  );
};

export default GameWrapper;
