import React, { memo } from "react";
import useQuery from "../_Hooks/useQuery";
import { ITimedAction } from "../lib/game/schema/timedActionRecord";

const Chronos = memo(function Chronos() {
  const timedAction = useQuery("timedAction") as ITimedAction | null;
  return (
    <div>
      <div className="absolute top-0 z-40 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-bold">Chronos</h2>
          <p>Timed Actions</p>
          <p>Action: {timedAction ? timedAction.action.name : ""}</p>

          <p>Time: {timedAction ? timedAction.countdown / 1000 : ""}</p>
        </div>
      </div>
    </div>
  );
});

export default Chronos;
