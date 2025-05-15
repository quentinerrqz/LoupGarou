import React, { memo } from "react";
import useQuery from "../_Hooks/useQuery";
import { IParams } from "../lib/game/schema/ParamsRecord";

const EndPage = memo(function EndPage() {
  const params = useQuery("params") as IParams;
  const winner = params.winner;
  console.log("winner", winner);
  return (
    <div className="absolute top-0 right-0 w-[20%] h-full flex flex-col justify-center items-center ">
      <h1 className="text-2xl font-bold">Game Over</h1>
      <p className="text-xl">Winner: {winner}</p>
      <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded mt-4">
        Play Again
      </button>
    </div>
  );
});

export default EndPage;
