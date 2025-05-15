import PartySocket from "partysocket";
import { GameRecord } from "./schema";
import { IPlayer } from "./schema/PlayerRecord";
import { HistoryEntry, ServerToClientMessage } from "./types";
import { PARTYKIT_HOST } from "@/app/env";
import { Store } from "./store";

export function syncStore(
  store: Store<GameRecord>,
  clientId: IPlayer["id"],
  roomId: string,

  events = {} as {
    onReady?: () => void;
    onPing?: (ms: number) => void;
  }
) {
  const socket = new PartySocket({
    host: PARTYKIT_HOST,
    room: roomId,
    id: clientId,
    query: {
      clientId: clientId,
    },
  });

  // const clientClocks = new Map<string, number>()

  let lastPing = { timestamp: Date.now() };
  let lastClock = -1;

  const unsubs: (() => void)[] = [];

  const handleOpen = () => {
    socket.removeEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);

    const interval = setInterval(() => {
      lastPing = { timestamp: Date.now() };
      socket.send(
        JSON.stringify({ clientId: clientId, type: "ping", data: lastPing })
      );
    }, 1000);

    unsubs.push(() => clearInterval(interval));
  };

  const handleClose = () => {
    socket.removeEventListener("message", handleMessage);
    socket.addEventListener("open", handleOpen);
  };

  const handleMessage = (message: MessageEvent<any>) => {
    try {
      const data = JSON.parse(message.data) as ServerToClientMessage;

      lastClock = data.clock; // update the most recent server clock seen by this clock

      switch (data.type) {
        case "init": {
          store.loadSnapshot(data.snapshot);
          store.listen((e) => {
            if (!e.length) return;

            socket.send(
              JSON.stringify({
                clientId: clientId,
                type: "update",
                clock: lastClock, // send back the most recent server clock seen by this client
                updates: e,
              })
            );
          });
          events.onReady?.();

          break;
        }
        case "recovery": {
          console.error("received recovery");
          store.loadSnapshot(data.snapshot);
          break;
        }
        case "pong": {
          const now = Date.now();
          const ms = now - lastPing.timestamp;
          events.onPing?.(ms);

          break;
        }
        case "update": {
          try {
            store.mergeRemoteChanges(() => {
              for (const item of data.updates) {
                if (!item) continue;

                // If we sent it, skip it
                if (item.clientId === clientId) continue;

                for (const update of item.updates) {
                  const {
                    changes: { added, updated, removed },
                  } = update;

                  const allAdded = Object.values(added);
                  const allUpdated = Object.values(updated).map((u) => u[1]);
                  const allRemoved = Object.values(removed).map((r) => r.id);

                  if (allAdded.length) {
                    store.put(allAdded);
                  }

                  if (allUpdated.length) {
                    store.put(allUpdated);
                  }

                  if (allRemoved.length) {
                    store.remove(allRemoved);
                  }
                }
              }
            });
          } catch (e) {
            console.error(e);
            console.error("requested recovery");
            socket.send(
              JSON.stringify({ clientId: clientId, type: "recovery" })
            );
          }
          break;
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (event: HistoryEntry<GameRecord>[]) => {
    if (!event.length) return;
    socket.send(
      JSON.stringify({
        clientId: clientId,
        type: "update",
        clock: lastClock, // send back the most recent server clock seen by this client
        updates: event,
      })
    );
  };

  socket.addEventListener("open", handleOpen);
  socket.addEventListener("close", handleClose);
  unsubs.push(() => store.listen((e) => handleChange(e)));

  // unsubs.push(
  // 	store.listen(handleChange, {
  // 		source: 'user',
  // 		scope: 'presence',
  // 	})
  // )

  unsubs.push(() => socket.removeEventListener("open", handleOpen));
  unsubs.push(() => socket.removeEventListener("close", handleClose));
  unsubs.push(() => socket.close());

  return unsubs;
}
