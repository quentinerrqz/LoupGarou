

import RoomButton from "@/components/_Menu/RoomButton";
import { createRoom } from "./_actions/createRoom";



export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-full w-full">
      <RoomButton create={createRoom} />
    </main>
  );
}
