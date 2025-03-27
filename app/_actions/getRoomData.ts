"use server";

import { notFound } from "next/navigation";
import { Game } from "../GameLogic/logic";
import { PARTYKIT_URL } from "../env";

export async function getRoomData(roomId: string) {
  try {
    const req = await fetch(`${PARTYKIT_URL}/party/${roomId}`, {
      method: "GET",
      next: {
        revalidate: 0,
      },
    });
    return req.json() as Promise<Game>;
  } catch (error) {
    console.error("Error fetching room:", error);
    return notFound();
  }
}
