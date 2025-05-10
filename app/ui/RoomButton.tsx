"use client";
import { redirect } from "next/navigation";
import React from "react";



const RoomButton = () => {
  const handleClick = ()=>{
    const roomId = Math.random().toString(36).substring(2, 10);
    redirect(`/${roomId}`);
  }


  return (
    <div className="flex items-center justify-center h-full w-full backdrop-blur-sm bg-slate-900/30">
      <button
        type="button"
        onClick={handleClick}
        className="font-bold text-2xl bg-red-600 p-2 rounded-lg hover:bg-red-700 transition-all hover:scale-105 hover:text-white"
      >
        Create a Room
      </button>
    </div>
  );
};

export default RoomButton;
