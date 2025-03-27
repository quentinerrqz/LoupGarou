"use server";

import { notFound, redirect } from "next/navigation";
import { PARTYKIT_URL } from "../env";
import { initialgameState } from "../GameLogic/logic";

export async function createRoom() {
  const randomId = () => Math.random().toString(36).substring(2, 10);
  const id = randomId();

  
  try {
    const req = await fetch(`${PARTYKIT_URL}/party/${id}`, {
      method: "POST",
      body: JSON.stringify(initialgameState),
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Room created: ",req);
  } catch (error) {
    console.error("Error creating room:", error);
    return notFound();
  }
  // if (!req.ok) {
  //   console.log(req.status);
  //   if (req.status === 404) {
  //     notFound();
  //   } else {
  //     return notFound();
  //   }
  // }
  // await fetch(`${PARTYKIT_URL}/party/${id}`, {
  //   method: "POST",
  //   body: JSON.stringify(initialgameState),
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  // });

  redirect(`/${id}`);
}
