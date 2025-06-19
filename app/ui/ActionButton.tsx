import React, { act, memo } from "react";
import useQuery from "../_Hooks/useQuery";
import { IPlayer } from "../lib/game/schema/PlayerRecord";
import { IRole } from "../lib/game/schema/RoleRecord";
import { IParams } from "../lib/game/schema/ParamsRecord";
import { game } from "./GameProvider";

const ActionButton = memo(function ActionButton() {
  const closestPlayer = useQuery("closestPlayer") as IPlayer;

  const player = useQuery("player") as IPlayer;
  const role = player.role as IRole;
  const params = useQuery("params") as IParams;
  const { actualGameAction } = params;
  if (!actualGameAction) return null;
  const whoIsActive =
    actualGameAction.name === "wake" ? actualGameAction.who : null;

  const handleClick = () => {
    actions[role.name as keyof typeof actions].action();
  };

  let style;
  let content;

  if (role.name === "loup-garou") {
    style = "bg-red-500 text-white font-bold py-2 px-4 rounded";
    content = "Attack";
  } else if (role.name === "voyante") {
    style = "bg-blue-500 text-white font-bold py-2 px-4 rounded";
    content = "See";
  } else if (role.name === "sorcière") {
    style = "bg-green-500 text-white font-bold py-2 px-4 rounded";
    content = "Save/Kill";
  }

  const actions = {
    "loup-garou": {
      name: "Attack",
      action: () => {
        game?.targetToKill("loup-garou", closestPlayer);
      },
    },
    voyante: {
      name: "See",
      action: () => {
        // Handle see action
      },
    },
    sorcière: {
      name: "Save/Kill",
      action: () => {
        // Handle save/kill action
      },
    },
  };

  return (
    <div className="absolute bottom-0 z-40 right-8 flex justify-center items-center">
      {whoIsActive === role.name ? (
        <div>
          {
            <button onClick={handleClick} className={`${style} `}>
              {content}
            </button>
          }
        </div>
      ) : (
        <div className="bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded">
          <p>{role.name}</p>
          <p>{actualGameAction.name}</p>
          {closestPlayer && (
            <div>
              <p>Closest Player: {closestPlayer.name}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default ActionButton;
