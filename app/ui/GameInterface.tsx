import React, { memo } from "react";
import Chat from "./Chat";
import useQuery from "../_Hooks/useQuery";
import { IParams } from "../lib/game/schema/ParamsRecord";
import UserNameEdit from "./UserNameEdit";
import Roles from "./Roles";
import ReadyButton from "./ReadyButton";
import RoleCard from "./RoleCard";
import Regles from "./Regles";
import { Table } from "p5";
import TableInfo from "./TableInfo";
import ActionButton from "./ActionButton";
import EndPage from "./EndPage";

const GameInterface = memo(function GameInterface() {
  const gameParams = useQuery("params") as IParams;
  return (
    <>
      {gameParams?.page === "lobby" && (
        <>
          <div className="absolute top-0 right-0 w-[20%] h-full flex flex-col justify-center items-center ">
            <Roles />
            <ReadyButton />
          </div>
          <Regles />
          <UserNameEdit />
        </>
      )}
      {gameParams?.page === "game" && (
        <>
        <TableInfo />
          <RoleCard />
          <Chat />
          <Regles />
          <ActionButton />
        </>
      )}
      {gameParams?.page === "end" && (
        <>
          <EndPage />
        </>
      )}
    </>
  );
});

export default GameInterface;
