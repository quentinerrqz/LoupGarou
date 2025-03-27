"use client";
import React, { FC } from "react";

type RoomButtonProps = {
  create: () => void;
};

const RoomButton = ({create}:RoomButtonProps) => {
  return (
    <div className="flex items-center justify-center h-full w-full backdrop-blur-sm bg-slate-900/30">
      <button
        type="button"
        onClick={() => alert("Room Created!")}
        
        className="font-bold text-2xl bg-red-600 p-2 rounded-lg hover:bg-red-700 transition-all hover:scale-105 hover:text-white"
      >
        Create a Room
      </button>
    </div>
  );
};

export default RoomButton;
