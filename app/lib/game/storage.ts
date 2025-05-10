"use client";

import { IPlayer, PlayerRecord } from "./schema/PlayerRecord";
import { v4 } from "uuid";

export function getLocalPlayer() {
  // Get the user from local storage

  // let player: IPlayer;
  // let userName: string;
  // try {
  //   const userNameStr =
  //     typeof localStorage !== "undefined"
  //       ? localStorage.getItem("LoupG_username")
  //       : null;
  //   if (!userNameStr) throw new Error("No user found");
  //   userName = userNameStr;
  // } catch (e) {
  //   userName = "";
  // }

  // try {
  //   const userStr =
  //     typeof localStorage !== "undefined"
  //       ? localStorage.getItem("LoupG_user")
  //       : null;
  //   if (!userStr) throw new Error("No user found");
  //   player = JSON.parse(userStr);
  // } catch (e) {
  //   const userId = v4();

  //   player = new PlayerRecord({
  //     id: userId,
  //     name: userName,
  //     position: { x: 0, y: 0 },
  //   });

  //   if (typeof localStorage !== "undefined") {
  //     localStorage.setItem("LoupG_user", JSON.stringify(player));
  //   }
  // }

  const userId = v4();

  const player = new PlayerRecord({
    id: userId,
    name: " ",
    position: { x: 0, y: 0 },
  });
  return player;
}

export function persistLocalPlayer(player: IPlayer) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("LoupG_username", JSON.stringify(player.name));
    localStorage.setItem("LoupG_user", JSON.stringify(player));
  }
}
