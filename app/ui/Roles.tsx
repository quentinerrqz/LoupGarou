import React, { memo } from "react";
import useQuery from "../_Hooks/useQuery";
import { IParams } from "../lib/game/schema/ParamsRecord";

const colorMap: Record<string, string> = {
  villageois: "text-green-500",
  "loup-garou": "text-red-500",
  sorcière: "text-purple-500",
  voyante: "text-blue-500",
  chasseur: "text-yellow-500",
  cupidon: "text-pink-500",
  "petite-fille": "text-orange-500",
};

const Roles = memo(function Roles() {
  const params = useQuery("params") as IParams;
  const { roles } = params;

  
  return (
    
      <ul className="">
        {Object.entries(
          roles.reduce((acc, role) => {
            acc[role.name] = (acc[role.name] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        )
          .sort(([roleNameA], [roleNameB]) =>
            roleNameA.localeCompare(roleNameB)
          )
          .map(([roleName, count], i) => (
            <li
              key={i}
              className={`${
                params.page == "lobby" ? colorMap[roleName] : ""
              } text-center text-lg font-bold`}
            >
              {roleName}: {count}
            </li>
          ))}
      </ul>
   
  );
});

export default Roles;

/**
 * {Object.entries(
        gameState.roles
          .filter((r) => r.isAlive)
          .reduce((acc, role) => {
            acc[role.name] = (acc[role.name] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
      ).map(([roleName, count], i) => (
        console.log(roleName),
        <li key={i} className={`${ gameState.page=="play"? colorMap[roleName] :""}`} >
          {roleName}: {count}
        </li>
      ))}
 */
