import { createContext, useContext } from "react";
import { IPlayer } from "../lib/game/schema/PlayerRecord";
import { Box } from "../lib/Box";
import { IMessage } from "../lib/game/schema/MessageRecord";
import { IParams } from "../lib/game/schema/ParamsRecord";
import { ITimedAction } from "../lib/game/schema/timedActionRecord";

export const gamePlayerQueryContext = createContext({} as IPlayer);
export const gamePlayersQueryContext = createContext([] as IPlayer[]);
export const gameMessagesQueryContext = createContext([] as IMessage[]);
export const gameParamsQueryContext = createContext({} as IParams);
export const gameIsPlayerReadyQueryContext = createContext(false as boolean);
export const gameTimedActionQueryContext = createContext(null as ITimedAction | null);
export const gameClosestPlayerQueryContext = createContext({} as IPlayer);
export const gameScreenSizeQueryContext = createContext(new Box(0, 0, 0, 0));

const useQuery = <
  T extends
    | IPlayer
    | IPlayer[]
    | IMessage[]
    | IParams
    | boolean
    | ITimedAction
    | null
    | Box
>(
  type: string
) => {
  const context =
    type === "player"
      ? gamePlayerQueryContext
      : type === "players"
      ? gamePlayersQueryContext
      : type === "messages"
      ? gameMessagesQueryContext
      : type === "params"
      ? gameParamsQueryContext
      : type === "screenSize"
      ? gameScreenSizeQueryContext
      : type === "timedAction"
      ? gameTimedActionQueryContext
      : type === "isPlayerReady"
      ? gameIsPlayerReadyQueryContext
      : type === "closestPlayer"
      ? gameClosestPlayerQueryContext
      : null;

  if (!context) {
    throw new Error(`useQuery: Unknown type "${type}"`);
  }
  const query = useContext(context as unknown as React.Context<T>);

  if (query === undefined) {
    throw new Error("useQuery must be used within a QueryProvider");
  }
  return query;
};

export default useQuery;
