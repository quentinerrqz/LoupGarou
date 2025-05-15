import React, { memo } from "react";
import useQuery from "../_Hooks/useQuery";
import { IPlayer } from "../lib/game/schema/PlayerRecord";

const RoleCard = memo(function RoleCard() {
  const colorMap: Record<string, string> = {
    villageois: "bg-green-500 text-white",
    "loup-garou": "bg-red-500 text-white",
    sorcière: "bg-purple-500 text-white",
    voyante: "bg-blue-500 text-white",
    chasseur: "bg-yellow-500 text-white",
    cupidon: "bg-pink-500 text-white",
    "petite-fille": "bg-orange-500 text-white",
  };

  const player = useQuery("player") as IPlayer;
  const role = player.role?.name;
  return (
    <div
      className={`absolute left-0 top-0 size-20 p-2 flex justify-center items-center z-20 ${
        role ? colorMap[role] : "bg-amber-300"
      }`}
    >
      {role}
    </div>
  );
});

export default RoleCard;
