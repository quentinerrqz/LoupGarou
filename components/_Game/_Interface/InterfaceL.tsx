import { User } from "@/app/GameLogic/logic";
import React, { memo } from "react";

const InterfaceL = memo(function InterfaceL() {
  console.log("interfaceL");
  return (
    <h1 className="z-50 absolute top-0 left-0 flex text-white font-bold justify-center ">
      Hello
    </h1>
  );
});

export default InterfaceL;
