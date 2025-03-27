"use server";

import { randomUUID } from "crypto";
import GameL from "@/components/_Game/GameL";
import { getRoomData } from "../_actions/getRoomData";

export default async function PollPage(props: {
  params: Promise<{ poll_id: string }>;
}) {
  const params = await props.params;
  const pollId = params.poll_id;

  const userId = randomUUID();

  const game = await getRoomData(pollId);
  return (
    <div className="h-full w-full">
      <GameL game={game} roomId={pollId} userId={userId} />
    </div>
  );
}
