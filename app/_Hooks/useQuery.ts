import { createContext, useContext } from "react";
import { IPlayer } from "../lib/game/schema/PlayerRecord";
import { Box } from "../lib/Box";

export const gamePlayerQueryContext = createContext({} as IPlayer);
export const gamePlayersQueryContext = createContext([] as IPlayer[]);
export const gameScreenSizeQueryContext = createContext(new Box(0, 0, 0, 0));

const useQuery = <T extends IPlayer | IPlayer[] | Box>(type: string) => {
  const context =
    type === "player"
      ? gamePlayerQueryContext
      : type === "players"
      ? gamePlayersQueryContext
      : type === "screenSize"
      ? gameScreenSizeQueryContext
      : null;

  if (!context) {
    throw new Error(`useQuery: Unknown type "${type}"`);
  }
  const query = useContext(context as unknown as React.Context<T>);

  if (!query) {
    throw new Error("useQuery must be used within a QueryProvider");
  }
  return query;
};

export default useQuery;

// export const gameStaticContext = createContext({} as Game);

// export const useGameStatic = () => {
//   const context = useContext(gameStaticContext);
//   if (!context) {
//     throw new Error("useGameStatic must be used within a GameStaticProvider");
//   }
//   return context;
// };
