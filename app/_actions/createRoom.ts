'use server'

import { redirect } from "next/navigation";
import { PARTYKIT_URL } from "../env";
import { initialgameState } from "../GameLogic/logic";

 export async function createRoom() {
    const randomId = () => Math.random().toString(36).substring(2, 10);
    const id = randomId();

    await fetch(`${PARTYKIT_URL}/party/${id}`, {
      method: "POST",
      body: JSON.stringify(initialgameState),
      headers: {
        "Content-Type": "application/json",
      },
    });

    redirect(`/${id}`);
  }

