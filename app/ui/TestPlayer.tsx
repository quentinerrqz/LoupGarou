import { useEffect, useRef, useState } from "react";

import { IPlayer } from "../lib/game/schema/PlayerRecord";
import { Box } from "../lib/Box";
import useQuery from "../_Hooks/useQuery";

export const Player = ({ player }: { player: IPlayer }) => {
  const rContainer = useRef<HTMLDivElement>(null);
  const screenSize = useQuery<Box>("screenSize");

  const pos = player.position;

  const { x, y } = pos ? pos : { x: 0, y: 0 };
  

  useEffect(() => {
    if (!rContainer.current) return;
    const elm = rContainer.current;
    const cx = screenSize.x + screenSize.w / 2;
    const cy = screenSize.y + screenSize.h / 2;
    elm.style.setProperty("transform", `translate(${cx + x}px, ${cy + y}px)`);
  }, [rContainer, screenSize, x, y]);
  if (!player) return null;

  const positionStyle: React.CSSProperties = {
    position: "absolute",
    width: "100px",
    height: "100px",
    backgroundColor: "blue",
    transform: `translate(-50%, -50%)`,
    borderRadius: "50%",
  };

  return (
    <>
      <div ref={rContainer} style={positionStyle} draggable={false}>
        <div className="flex text-white justify-center items-center h-full w-full z-10">
          {player.name ? player.name : "Player"}
        </div>
      </div>
    </>
  );
};
