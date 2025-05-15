import React, { memo } from "react";
import useQuery from "../_Hooks/useQuery";
import { IParams } from "../lib/game/schema/ParamsRecord";

const ActualAction = memo(function actualAction() {
  const params = useQuery("params") as IParams;
  const actualGameAction = params?.actualGameAction;


  return (
    <div className="absolute top-72 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h1 className="text-xl font-bold">Actual Action</h1>
        <p>{actualGameAction ? actualGameAction.name : ""}</p>
      </div>
    </div>
  );
});

export default ActualAction;
