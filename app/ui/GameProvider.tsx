"use client";
import React, { use, useEffect, useRef, useState } from "react";
import { gameStaticContext } from "@/app/_Hooks/useGame";
import { Game } from "@/app/lib/game/Game";

import {
  gamePlayerQueryContext,
  gamePlayersQueryContext,
  gameMessagesQueryContext,
  gameParamsQueryContext,
  gameIsPlayerReadyQueryContext,
  gameClosestPlayerQueryContext,
  gameTimedActionQueryContext,
  gameScreenSizeQueryContext,
} from "@/app/_Hooks/useQuery";

import { IPlayer } from "@/app/lib/game/schema/PlayerRecord";
import { Box } from "@/app/lib/Box";
import ConnectionPage from "./ConnectionPage";
import { IMessage } from "../lib/game/schema/MessageRecord";
import { IParams } from "../lib/game/schema/ParamsRecord";
import { ITimedAction } from "../lib/game/schema/timedActionRecord";

type GameQuery = {
  player: IPlayer;
  players: IPlayer[];
  messages: IMessage[];
  params: IParams;
  isPlayerReady: boolean;
  closestPlayer: IPlayer | null;
  timedAction: ITimedAction | null;
  screenSize: Box;
 
};

type Props = {
  children: React.ReactNode;
  roomId: string;
};

export let game: Game | null = null;

const GameProvider = ({ children, roomId }: Props) => {
  const oldGameQuery = useRef<GameQuery>({
    player: {} as IPlayer,
    players: [] as IPlayer[],
    messages: [] as IMessage[],
    params: {} as IParams,
    isPlayerReady: false,
    closestPlayer: null,
    timedAction: null,
    screenSize: {} as Box,
  });
  const [ready, setIsReady] = useState(false);
  const [gameStatic, setGameStatic] = useState<Game>({} as Game);
  const [playerQuery, setPlayerQuery] = useState<IPlayer>({} as IPlayer);
  const [playersQuery, setPlayersQuery] = useState<IPlayer[]>([] as IPlayer[]);
  const [paramsQuery, setParamsQuery] = useState<IParams>({} as IParams);
  const [messagesQuery, setMessagesQuery] = useState<IMessage[]>(
    [] as IMessage[]
  );
  const [screenSizeQuery, setScreenSizeQuery] = useState(new Box(0, 0, 0, 0));
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [closestPlayerQuery, setClosestPlayerQuery] = useState<IPlayer | null>(
    null
  );
  const [timedActionQuery, setTimedActionQuery] = useState<ITimedAction | null>(
    null
  );

  const setGameQuery = (newQuery: GameQuery) => {
    const old = oldGameQuery.current;
    const conditions = [
      JSON.stringify(newQuery.player) !== JSON.stringify(old.player),
      JSON.stringify(newQuery.players) !== JSON.stringify(old.players),
      JSON.stringify(newQuery.messages) !== JSON.stringify(old.messages),
      JSON.stringify(newQuery.params) !== JSON.stringify(old.params),
      JSON.stringify(newQuery.isPlayerReady) !==
        JSON.stringify(old.isPlayerReady),
      JSON.stringify(newQuery.closestPlayer) !==
        JSON.stringify(old.closestPlayer),
      JSON.stringify(newQuery.timedAction) !== JSON.stringify(old.timedAction),
      JSON.stringify(newQuery.screenSize) !== JSON.stringify(old.screenSize),
    ];

    if (conditions[0]) {
      setPlayerQuery(newQuery.player);
      oldGameQuery.current.player = newQuery.player;
    }
    if (conditions[1]) {
      setPlayersQuery(newQuery.players);
      oldGameQuery.current.players = newQuery.players;
    }
    if (conditions[2]) {
      setMessagesQuery(newQuery.messages);
      oldGameQuery.current.messages = newQuery.messages;
    }
    if (conditions[3]) {
      setParamsQuery(newQuery.params);
      oldGameQuery.current.params = newQuery.params;
    }

    if (conditions[4]) {
      setIsPlayerReady(newQuery.player?.isReady || false);
      oldGameQuery.current.isPlayerReady = newQuery.player.isReady;
    }
    if (conditions[5]) {
      setClosestPlayerQuery(newQuery.closestPlayer);
      oldGameQuery.current.closestPlayer = newQuery.closestPlayer;
    }
    if (conditions[6]) {
      setTimedActionQuery(newQuery.timedAction);
      oldGameQuery.current.timedAction = newQuery.timedAction;
    }
    if (conditions[7]) {
      setScreenSizeQuery(newQuery.screenSize);
      oldGameQuery.current.screenSize = newQuery.screenSize;
    }
  };

  useEffect(() => {
    setIsReady(false);
    const gameReact = new Game({
      roomId,
      onReady: () => setIsReady(true),
      onUpdate: (g) => {
        const newQuery = {
          player: g.player,
          players: g.players,
          messages: g.messages,
          params: g.gameParams,
          isPlayerReady: g.player?.isReady || false,
          closestPlayer: g.player?.closestPlayer || null,
          timedAction: g.timedAction,
          screenSize: g.screenSize,
          
        };
        setGameQuery(newQuery);

        game = g;
      },
    });
    const newQuery = {
      player: gameReact.player,
      players: gameReact.players,
      messages: gameReact.messages,
      params: gameReact.gameParams,
      isPlayerReady: gameReact.player?.isReady || false,
      closestPlayer: gameReact.player?.closestPlayer || null,
      timedAction: gameReact.timedAction,
      screenSize: gameReact.screenSize,

    };
    setGameQuery(newQuery);
    setGameStatic(gameReact);
    game = gameReact;
    return () => {
      gameReact.dispose();
      game = null;
    };
  }, [roomId, setGameStatic]);

  if (!ready) return <ConnectionPage />;
  return (
    <gameStaticContext.Provider value={gameStatic}>
      <gamePlayerQueryContext.Provider value={playerQuery}>
        <gamePlayersQueryContext.Provider value={playersQuery}>
          <gameMessagesQueryContext.Provider value={messagesQuery}>
            <gameParamsQueryContext.Provider value={paramsQuery}>
              <gameIsPlayerReadyQueryContext.Provider
                value={isPlayerReady || false}
              >
                <gameClosestPlayerQueryContext.Provider
                  value={closestPlayerQuery || ({} as IPlayer)}
                >
                  <gameTimedActionQueryContext.Provider
                    value={timedActionQuery}
                  >
                    <gameScreenSizeQueryContext.Provider
                      value={screenSizeQuery}
                    >
                      {children}
                    </gameScreenSizeQueryContext.Provider>
                  </gameTimedActionQueryContext.Provider>
                </gameClosestPlayerQueryContext.Provider>
              </gameIsPlayerReadyQueryContext.Provider>
            </gameParamsQueryContext.Provider>
          </gameMessagesQueryContext.Provider>
        </gamePlayersQueryContext.Provider>
      </gamePlayerQueryContext.Provider>
    </gameStaticContext.Provider>
  );
};

export default GameProvider;
