import { notFound } from "next/navigation";
import { PARTYKIT_URL } from "@/app/env";

import { randomUUID } from "crypto";
import { Game } from "../GameLogic/logic";
import P5SketchContainer from "@/components/_Game/P5SketchContainer";
import { gameSketch } from "../GameLogic/p5sketch";
import GameL from "@/components/_Game/GameL";

export default async function PollPage({
  params,
}: {
  params: { poll_id: string };
}) {
  const pollId = params.poll_id;

  const req = await fetch(`${PARTYKIT_URL}/party/${pollId}`, {
    method: "GET",
    next: {
      revalidate: 0,
    },
  });

  if (!req.ok) {
    if (req.status === 404) {
      notFound();
    } else {
      throw new Error("Something went wrong.");
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
