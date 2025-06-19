import React, { memo, useCallback, useEffect } from "react";
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
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { IPlayer } from "../lib/game/schema/PlayerRecord";

const GameInterface = memo(function GameInterface() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const userName = (useQuery("player") as IPlayer).name || "Player";
  // Get a new searchParams string by merging the current
  // searchParams with a provided key/value pair
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    router.push(pathname + "?" + createQueryString("userName", userName));
  }, [userName, pathname, router, createQueryString]);

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
