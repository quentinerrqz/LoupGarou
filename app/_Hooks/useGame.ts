import { createContext, useContext } from "react";
import { Game } from "../lib/game/Game";

export const gameStaticContext = createContext({} as Game);

export const useGameStatic = () => {
  const context = useContext(gameStaticContext);
  if (!context) {
    throw new Error("useGameStatic must be used within a GameStaticProvider");
  }
  return context;
};
