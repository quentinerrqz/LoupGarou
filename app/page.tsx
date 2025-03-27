"use server";

import { redirect } from "next/navigation";
import { PARTYKIT_URL } from "./env";
import RoomButton from "@/components/_Menu/RoomButton";
import { initialgameState } from "./GameLogic/logic";

const randomId = () => Math.random().toString(36).substring(2, 10);

export default function Home() {
  async function createPoll() {
    "use server";

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

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <RoomButton create={createPoll} />
    </div>
  );
}
