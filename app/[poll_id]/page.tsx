"use server";

import { notFound } from "next/navigation";
import { PARTYKIT_URL } from "@/app/env";

import { randomUUID } from "crypto";
import { Game } from "../GameLogic/logic";
import GameL from "@/components/_Game/GameL";

export default async function PollPage(props: {
  params: Promise<{ poll_id: string }>;
}) {
  const params = await props.params;
  const pollId = params.poll_id;

  const req = await fetch(`${PARTYKIT_URL}/party/${pollId}`, {
    method: "GET",
    next: {
      revalidate: 0,
    },
  });

  if (!req.ok) {
    console.log(req.status);
    if (req.status === 404) {
      notFound();
    } else {
      return notFound();
    }
  }

  const game = (await req.json()) as Game;
  const userId = randomUUID();

  return (
    <div className="h-full w-full">
      <GameL game={game} roomId={pollId} userId={userId} />
    </div>
  );
}
