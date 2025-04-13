"use client";
import usePartySocket from "partysocket/react";
import { useState } from "react";
import { PARTYKIT_HOST } from "../env";
import { Action, Game, gameUpdater, Player, User } from "../GameLogic/logic";

interface game {
  users: User[];
  players: Player[];
  page: string;
  time: number;
  countdown: number;
  update: (newState: Game) => void;
}
const game: game = {
  users: [],
  players: [],
  page: "lobby",
  time: 0,
  countdown: 0,
  update: (newState: Game) => {
    game.users = newState.users;
    game.players = newState.players;
    game.page = newState.page;
    game.time = newState.time;
    game.countdown = newState.countdown;
  },
};

type Message = {
  type: string;
  content: Game | Action;
};

let socket: any;

const typeNotToRender = ["move"];

//React hook pour la gestion du jeu via l'interface utilisateur
export const useGameRoom = (roomId: string, game1: Game, userId: string) => {
  const [gameState, setGameState] = useState<Game>(game1);
  // Établie la connexion avec le serveur
  socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: roomId,
    id: userId,
    onMessage(event) {
      const message = JSON.parse(event.data) as Message;
      if (typeNotToRender.includes(message.type)) {
        const action = message.content as Action;
        const oldGameState = {
          users: game.users,
          players: game.players,
          page: game.page,
          time: game.time,
          countdown: game.countdown,
        };
        const newGameState = gameUpdater(oldGameState as Game, action) as Game; // Met à jour l'état du jeu en fonction de l'action reçue
        game.update(newGameState); // Met à jour l'état du jeu
        return;
      } else {
        setGameState(message.content as Game);
        game.update(message.content as Game); // Met à jour l'état du jeu
      }
    },
  });

  const dispatch = (action: Action) => {
    socket.send(JSON.stringify(action)); // Envoie l'action au serveur
  };

  return {
    gameState, // État actuel du jeu
    dispatch,
  };
};

export default game;

// Le React hook provoque un rerender du composant à chaque fois que l'état du jeu change.
// Cependant, le rerender n'est pas toujours nécessaire, il est possible de le limiter
// en utilisant la fonction sendToGame qui envoie l'action au serveur et met à jour l'état du jeu
// défini par "game" dans le fichier useGameRoom.tsx

export const sendToGame = (action: Action) => {
  if (!socket) return;
  socket.send(JSON.stringify(action));
};
