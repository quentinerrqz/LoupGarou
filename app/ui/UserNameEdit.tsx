import React, { memo, use, useCallback, useRef } from "react";
import { game } from "./GameProvider";

const UserNameEdit = memo(function UserNameEdit() {
  const input = useRef<HTMLInputElement>(null);
  const handleClick = useCallback(() => {
    const inputElement = input.current;
    if (inputElement && inputElement.value) {
      const name = inputElement.value;
      game?.updatePlayerName(name);
      inputElement.value = "";
    }
  }, []);
  return (
    <div className="absolute bottom-0 w-full flex justify-center items-center">
      <div className="w-[30%] flex items-center bg-slate-900/30 border border-white rounded-lg shadow-lg text-white p-2 gap-1">
        <input
          ref={input}
          type="text"
          maxLength={10}
          placeholder="Enter your name"
          className="w-full p-2 border rounded "
        />
        <button
          onClick={handleClick}
          className=" bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
});

export default UserNameEdit;
