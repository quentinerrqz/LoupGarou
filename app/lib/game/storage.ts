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
    name: randomName(),
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

const randomName = () => {
  const names = [
    "Alice",
    "Bob",
    "Charlie",
    "David",
    "Eve",
    "Frank",
    "Grace",
    "Heidi",
    "Ivan",
    "Judy",
    "Mallory",
    "Oscar",
    "Peggy",
    "Trent",
    "Walter",
    "Zoe",
    "Alex",
    "Bella",
    "Chris",
    "Diana",
    "Ethan",
    "Fiona",
    "George",
    "Hannah",
    "Isaac",
    "Julia",
    "Kevin",
    "Linda",
    "Mike",
    "Nina",
    "Oliver",
    "Pam",
    "Quinn",
    "Rachel",
    "Steve",
    "Tina",
    "Ursula",
    "Victor",
    "Wendy",
    "Xander",
    "Yvonne",
    "Zack",
    "Hello World",
  ];
  return names[Math.floor(Math.random() * names.length)];
};
