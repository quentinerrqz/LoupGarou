import { Game } from "@/app/GameLogic/logic";
import React, { memo } from "react";



type Props = {
  gameState: Game;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  userId: string;
};

const InterfaceL = memo(function InterfaceL({
  gameState,
  dispatch,
  userId,
}: Props) {
  console.log("InterfaceL rendered");
  return (
    <>
      {/* {gameState.page === "lobby" && (
        <Lobby gameState={gameState} dispatch={dispatch} userId={userId} />
      )}
      {gameState.page === "play" && (
        <GamePlay gameState={gameState} dispatch={dispatch} userId={userId} />
      )} */}
    </>
  );
});

export default InterfaceL;
