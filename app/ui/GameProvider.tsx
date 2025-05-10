"use client";
import React, { use, useEffect, useRef, useState } from "react";
import { gameStaticContext } from "@/app/_Hooks/useGame";
import { Game } from "@/app/lib/game/Game";

import {
  gamePlayerQueryContext,
  gamePlayersQueryContext,
  gameScreenSizeQueryContext,
} from "@/app/_Hooks/useQuery";

import { IPlayer } from "@/app/lib/game/schema/PlayerRecord";
import { Box } from "@/app/lib/Box";
import ConnectionPage from "./ConnectionPage";

type GameQuery = {
  player: IPlayer;
  players: IPlayer[];
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
    screenSize: {} as Box,
  });
  const [ready, setIsReady] = useState(false);
  const [gameStatic, setGameStatic] = useState<Game>({} as Game);
  const [playerQuery, setPlayerQuery] = useState<IPlayer>({} as IPlayer);
  const [playersQuery, setPlayersQuery] = useState<IPlayer[]>([] as IPlayer[]);
  const [screenSizeQuery, setScreenSizeQuery] = useState(new Box(0, 0, 0, 0));

  const setGameQuery = (newQuery: GameQuery) => {
    const old = oldGameQuery.current;
    const conditions = [
      newQuery.player !== old.player,
      newQuery.players !== old.players,
      newQuery.screenSize !== old.screenSize,
    ];

    if (conditions[0]) {
      setPlayerQuery(newQuery.player);
    }
    if (conditions[1]) {
      setPlayersQuery(newQuery.players);
    }
    if (conditions[2]) {
      setScreenSizeQuery(newQuery.screenSize);
    }

    oldGameQuery.current = newQuery;
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
          screenSize: g.screenSize,
        };

        setGameQuery(newQuery);

        game = g;

      },
    });
    const newQuery = {
      player: gameReact.player,
      players: gameReact.players,
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

  if (!ready) return <ConnectionPage/>;
  return (
    <gameStaticContext.Provider value={gameStatic}>
      <gamePlayerQueryContext.Provider value={playerQuery}>
        <gamePlayersQueryContext.Provider value={playersQuery}>
          <gameScreenSizeQueryContext.Provider value={screenSizeQuery}>
            {children}
          </gameScreenSizeQueryContext.Provider>
        </gamePlayersQueryContext.Provider>
      </gamePlayerQueryContext.Provider>
    </gameStaticContext.Provider>
  );
};

export default GameProvider;
