import type * as Party from "partykit/server";

import { GameRecord } from "@/app/lib/game/schema";

import { IPlayer } from "@/app/lib/game/schema/PlayerRecord";
import {
  ClientToServerMessage,
  ClientUpdateFromServer,
  HistoryEntry,
  RecordId,
  ServerRecord,
  ServerToClientMessage,
  StoreSnapshot,
} from "@/app/lib/game/types";

import { FRAME_LENGTH, SERVER_TICK_LENGTH } from "@/app/lib/game/constants";
import { updatePlayer } from "@/app/shared/updatePlayer";

export default class SyncParty implements Party.Server {
  records: Record<RecordId<GameRecord>, ServerRecord<GameRecord>> = {};
  clients = new Map<Party.Connection<unknown>, IPlayer["id"]>();

  getSnapshot = (): {
    store: StoreSnapshot<GameRecord>;
    // schema: SerializedSchema;
  } => {
    return {
      store: Object.fromEntries(
        Object.entries(this.records)
          .filter(([_, { record }]) => !!record)
          .map(([id, { record }]) => [id, record!])
      ) as unknown as StoreSnapshot<GameRecord>,
    };
  };

  updateRecord = (record: GameRecord) => {
    const previous = this.records[record.id];
    if (previous) {
      this.records[record.id] = { clock: previous.clock + 1, record };
    } else {
      this.records[record.id] = { clock: this.clock, record };
    }
  };

  getRecordById = <T extends GameRecord>(id: RecordId<T>) => {
    return this.records[id] as ServerRecord<T>;
  };

  constructor(readonly room: Party.Room) {
    let lastTime = 0;
    this.tick = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTime;
      lastTime = now;
      this.onTick(elapsed);
    }, SERVER_TICK_LENGTH);
  }

  tick: any;
  clock = 0;
  hasAlarm = false;

  async onConnect(connection: Party.Connection<unknown>) {
    connection.send(
      JSON.stringify({
        type: "init",
        clock: this.clock,
        snapshot: this.getSnapshot(),
      })
    );
  }

  onClose(connection: Party.Connection<unknown>): void | Promise<void> {
    const clientId = this.clients.get(connection);
    if (clientId) {
      this.removePlayer(clientId);
    }
    this.clients.delete(connection);
  }

  private removePlayer(clientId: IPlayer["id"]) {
    const clientPlayerRecord = this.getRecordById(clientId);

    if (clientPlayerRecord) {
      const { record } = clientPlayerRecord;
      if (record) {
        this.deleteRecord(record);
        const update: HistoryEntry<GameRecord> = {
          changes: {
            added: {},
            updated: {},
            removed: {
              [record.id]: record,
            },
          },
          source: "remote",
        };

        this.pendingUpdates.push({ clientId: "server", updates: [update] });
      }
    }
  }

  private applyUpdate(
    clock: number,
    updates: HistoryEntry<GameRecord>[]
  ): HistoryEntry<GameRecord> {
    const ourUpdate: HistoryEntry<GameRecord> = {
      changes: {
        added: {},
        updated: {},
        removed: {},
      },
      source: "remote",
    };

    for (const update of updates) {
      const {
        changes: { added, updated, removed },
      } = update as HistoryEntry<GameRecord>;
      // Try to merge the update into our local store
      for (const record of Object.values(added)) {
        if (this.records[record.id]?.clock > clock) {
          // noop, our copy is newer
          console.log("throwing out add record, ours is newer");
        } else {
          this.records[record.id] = { clock, record };
          ourUpdate.changes.added[record.id] = record;
        }
      }

      for (const fromTo of Object.values(updated)) {
        if (this.records[fromTo[1].id]?.clock > clock) {
          console.log("throwing out update record, ours is newer");
          // noop, our copy is newer
        } else {
          this.records[fromTo[1].id] = { clock: this.clock, record: fromTo[1] };
          ourUpdate.changes.updated[fromTo[1].id] = fromTo;
        }
      }
      for (const record of Object.values(removed)) {
        if (this.records[record.id]?.clock > clock) {
          console.log("throwing out removed record, ours is newer");
          // noop, our copy is newer
        } else {
          this.records[record.id] = { clock, record: null };
          ourUpdate.changes.removed[record.id] = record;
        }
      }
    }

    return ourUpdate;
  }

  pendingUpdates: ClientUpdateFromServer[] = [];

  onMessage(
    message: string,
    sender: Party.Connection<unknown>
  ): void | Promise<void> {
    const msg = JSON.parse(message as string) as ClientToServerMessage;

    if (!this.clients.has(sender)) {
      const { clientId } = msg;
      this.clients.set(sender, clientId as IPlayer["id"]);
    }
    switch (msg.type) {
      case "ping": {
        sender.send(
          JSON.stringify({
            clientId: "server",
            type: "pong",
            clock: this.clock,
          })
        );
        break;
      }
      case "update": {
        try {
          if (!msg) throw Error("No message");
          const modifiedUpdates = this.applyUpdate(this.clock, msg.updates);
          // If it works, broadcast the update to all other clients
          this.pendingUpdates.push({
            clientId: msg.clientId,
            updates: [modifiedUpdates],
          });
        } catch (err: any) {
          // If we have a problem merging the update, we need to send a snapshot
          // of the current state to the client so they can get back in sync.

          console.error("Error applying update", err);
          sender.send(
            JSON.stringify({
              type: "recovery",
              clientId: "server",
              clock: this.clock,
              snapshot: this.getSnapshot(),
            } satisfies ServerToClientMessage)
          );
        }
        break;
      }
      case "recovery": {
        // If the client asks for a recovery, send them a snapshot of the current state
        sender.send(
          JSON.stringify({
            type: "recovery",
            clientId: "server",
            clock: this.clock,
            snapshot: this.getSnapshot(),
          } satisfies ServerToClientMessage)
        );
        break;
      }
    }
  }

  onAlarm = (): void | Promise<void> => {};

  private getRecordsOfType = <T extends GameRecord>(type: T["typeName"]) => {
    return Object.values(this.records)
      .filter(({ record }) => record && record.typeName === type)
      .map(({ record }) => record) as T[];
  };

  private putRecord = <T extends GameRecord>(record: T) => {
    this.records[record.id] = {
      clock: this.clock++,
      record: Object.freeze(record),
    };
  };

  private deleteRecord = <T extends GameRecord>(record: T) => {
    this.records[record.id] = { clock: this.clock++, record: null };
  };

  onTick = (elapsed: number) => {
    const frames = elapsed / FRAME_LENGTH;

    const update: HistoryEntry<GameRecord> = {
      changes: {
        added: {},
        updated: {},
        removed: {},
      },
      source: "remote",
    };

    const players = this.getRecordsOfType<IPlayer>("player");
    players.forEach((player) => {
      const { player: nextPlayer, isPrivate } = updatePlayer(
        frames,
        player as IPlayer,
        // players,
        {
          name: "server",
        }
      );

      if (nextPlayer !== player) {
        this.putRecord(nextPlayer);

        if (!isPrivate) {
          update.changes.updated[nextPlayer.id] = [player, nextPlayer];
        }
      }

      // Create any new balls
    });

    // Update ball positions and delete any stopped balls

    // Get the hits after updating the players?

    // Delete any old kills

    this.clients.forEach((clientId, connection) => {
      if (connection.readyState === WebSocket.CLOSED) {
        this.clients.delete(connection);
        this.removePlayer(clientId);
      }
    });

    // Broadcast our updates
    this.room.broadcast(
      JSON.stringify({
        type: "update",
        clientId: "server",
        clock: this.clock,
        updates: [
          ...this.pendingUpdates,
          { clientId: "server", updates: [update] },
        ],
      })
    );

    this.pendingUpdates.length = 0;
  };
}
