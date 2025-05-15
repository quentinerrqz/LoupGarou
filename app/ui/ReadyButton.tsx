import React, { memo, useCallback } from "react";
import useQuery from "../_Hooks/useQuery";
import { game } from "./GameProvider";
import { ITimedAction } from "../lib/game/schema/timedActionRecord";

const ReadyButton = memo(function ReadyButton() {
  const isReady = useQuery("isPlayerReady") as boolean;
  const timedActionInit = useQuery("timedAction") as ITimedAction;
  const timedAction = timedActionInit
    ? timedActionInit.action.name === "start"
      ? timedActionInit
      : null
    : null;
  const handleClick = useCallback(() => {
    // Handle the button click event
    game?.updateIsReady();
  }, []);

  const getSeconds = () => {
    if (timedAction) {
      const seconds = Math.floor(timedAction.countdown / 1000);
      return seconds > 0 ? seconds : 0;
    }
    return "Cancel";
  };

  return (
    <button
      onClick={handleClick}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      {isReady ? getSeconds() : "Ready"}
    </button>
  );
});

export default ReadyButton;
