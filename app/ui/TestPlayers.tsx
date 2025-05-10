import { memo } from "react";
import useQuery from "../_Hooks/useQuery";
import { Player } from "./TestPlayer";
import { IPlayer } from "../lib/game/schema/PlayerRecord";

const TestPlayers = memo(function TestPlayers() {
 
  // const player = useQuery<IPlayer>("player")
  
const players = useQuery<IPlayer[]>("players");

  return (
    <>
      {players.map((player) => (
        <Player key={player.id} player={player} />
      ))}
      
    </>
  )
  
});

export default TestPlayers;
