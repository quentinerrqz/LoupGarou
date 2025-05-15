import type * as Party from "partykit/server";

import { GameRecord } from "@/app/lib/game/schema";

import { IPlayer } from "@/app/lib/game/schema/PlayerRecord";
import {
  ClientToServerMessage,
  ClientUpdateFromServer,
  GeneralAction,
  HistoryEntry,
  RecordId,
  ServerRecord,
  ServerToClientMessage,
  StoreSnapshot,
} from "@/app/lib/game/types";

import {
  FRAME_LENGTH,
  SERVER_TICK_LENGTH,
  TEMPS_DE_VOTE_MS,
  TEMPS_PAR_JOUEUR_MS,
  TOUR_DE_PREPARATION,
  TOUR_NORMAL,
} from "@/app/lib/game/constants";
import { updatePlayer } from "@/app/shared/updatePlayer";
import { IWoodLog, WoodLogRecord } from "@/app/lib/game/schema/WoodLogRecord";
import { randomUUID } from "crypto";
import { IParams, ParamsRecord } from "@/app/lib/game/schema/ParamsRecord";
import { classicRoles, RoleRecordType } from "@/app/lib/game/schema/RoleRecord";
import {
  ITimedAction,
  TimedActionRecord,
} from "@/app/lib/game/schema/timedActionRecord";
import { IVote } from "@/app/lib/game/schema/VoteRecord";
import next from "next";

export default class SyncParty implements Party.Server {
  records: Record<RecordId<GameRecord>, ServerRecord<GameRecord>> = {};
  clients = new Map<Party.Connection<unknown>, IPlayer["id"]>();
  IsStarting = false;
  isFirstTour = false;
  tourAgenda: string[] = TOUR_DE_PREPARATION.concat(TOUR_NORMAL);
  happenningBy: { genStateBefore: "wake" | "voteEnd"; who: "chasseur" } | null =
    null;
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

    for (let i = 0; i < 5; i++) {
      const radianAngle = (i * 2 * Math.PI) / 5;
      const radius = 150;
      const x = Math.cos(radianAngle) * radius;
      const y = Math.sin(radianAngle) * radius;
      const position = { x, y };
      const woodLog = new WoodLogRecord({
        id: randomUUID(),
        position: position,
      });
      this.putRecord(woodLog);
    }

    const gameParams = new ParamsRecord({
      id: randomUUID(),
      page: "lobby",
      isDay: true,
    });
    this.putRecord(gameParams);
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
      this.removeWoodLog(clientId);
    }
    this.clients.delete(connection);
    this.updateFullRoles();
  }

  private addWoodLog = (ownerId: IWoodLog["ownerId"]) => {
    if (!ownerId) return;

    const notOwnedWoodLogs = this.getRecordsOfType<IWoodLog>("wood_log").filter(
      (log) => log.ownerId === null
    );

    if (notOwnedWoodLogs.length > 0) {
      const woodLog = { ...notOwnedWoodLogs[0] }; // Create a mutable copy
      woodLog.ownerId = ownerId;
      this.putRecord(woodLog);
      const update: HistoryEntry<GameRecord> = {
        changes: {
          added: {},
          updated: {
            [woodLog.id]: [woodLog, woodLog],
          },
          removed: {},
        },
        source: "remote",
      };
      this.pendingUpdates.push({ clientId: "server", updates: [update] });
      return;
    } else {
      const woodLogRecord = new WoodLogRecord({
        id: randomUUID(),
        position: { x: Math.random() * 100, y: Math.random() * 100 },
        ownerId,
      });
      this.putRecord(woodLogRecord);
      const update: HistoryEntry<GameRecord> = {
        changes: {
          added: {
            [woodLogRecord.id]: woodLogRecord,
          },
          updated: {},
          removed: {},
        },
        source: "remote",
      };
      this.pendingUpdates.push({ clientId: "server", updates: [update] });
      this.updateWoodLogsPosition();
    }
  };

  private removeWoodLog = (ownerId: IWoodLog["ownerId"]) => {
    const woodLogs = this.getRecordsOfType<IWoodLog>("wood_log");
    const woodLog = woodLogs.find((log) => log.ownerId === ownerId)
      ? woodLogs.find((log) => log.ownerId === ownerId)
      : null;
    if (!woodLog) return;
    if (woodLogs.length > 5) {
      if (woodLog) {
        this.deleteRecord(woodLog);
        const update: HistoryEntry<GameRecord> = {
          changes: {
            added: {},
            updated: {},
            removed: {
              [woodLog.id]: woodLog,
            },
          },
          source: "remote",
        };

        this.pendingUpdates.push({ clientId: "server", updates: [update] });
        this.updateWoodLogsPosition();
      }
    } else {
      if (woodLog) {
        const mutableWoodLog = { ...woodLog }; // Create a mutable copy
        mutableWoodLog.ownerId = null;

        this.putRecord(mutableWoodLog);

        const update: HistoryEntry<GameRecord> = {
          changes: {
            added: {},
            updated: {
              [mutableWoodLog.id]: [woodLog, mutableWoodLog],
            },
            removed: {},
          },
          source: "remote",
        };
        this.pendingUpdates.push({ clientId: "server", updates: [update] });
      }
    }
  };

  private updateWoodLogsPosition = () => {
    const woodLogs = this.getRecordsOfType<IWoodLog>("wood_log");
    if (woodLogs.length === 0) return;
    const mutableWoodLogs = woodLogs.map((log) => ({ ...log })); // Create mutable copies
    const length = mutableWoodLogs.length;
    const radianAngle = (Math.PI * 2) / length;
    const radius = 150;
    for (const mutableWoodLog of mutableWoodLogs) {
      const index = mutableWoodLogs.findIndex(
        (log) => log.id === mutableWoodLog.id
      );
      if (index === -1) return;

      const x = Math.cos(radianAngle * index) * radius;
      const y = Math.sin(radianAngle * index) * radius;
      const position = { x, y };
      mutableWoodLog.position = position;
    }
    for (const woodLog of woodLogs) {
      const mutableWoodLog = mutableWoodLogs.find(
        (log) => log.id === woodLog.id
      );

      if (!mutableWoodLog) return;
      this.putRecord(mutableWoodLog);
      const update: HistoryEntry<GameRecord> = {
        changes: {
          added: {},
          updated: {
            [mutableWoodLog.id]: [woodLog, mutableWoodLog],
          },
          removed: {},
        },
        source: "remote",
      };
      this.pendingUpdates.push({ clientId: "server", updates: [update] });
    }
  };

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

  private updateFullRoles = () => {
    const params = this.getRecordsOfType<ParamsRecord>("params");
    if (params.length === 0) return;
    const paramsRecord = params[0];

    if (!paramsRecord) return;
    let newRoles: RoleRecordType[] = [];
    if (paramsRecord.page === "lobby") {
      switch (paramsRecord.rolesSchema) {
        case "classic":
          newRoles = classicRoles.slice(0, this.clients.size);
          break;

        default:
          newRoles = paramsRecord.roles.slice(0, this.clients.size);
          break;
      }
    }

    this.putRecord({ ...paramsRecord, roles: newRoles });

    const update: HistoryEntry<GameRecord> = {
      changes: {
        added: {},
        updated: {
          [paramsRecord.id]: [
            paramsRecord,
            {
              ...paramsRecord,
              roles: newRoles,
            },
          ],
        },
        removed: {},
      },
      source: "remote",
    };

    this.pendingUpdates.push({ clientId: "server", updates: [update] });
  };

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
      this.addWoodLog(clientId as IWoodLog["ownerId"]);
      this.updateFullRoles();
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

  onAlarm = (): void | Promise<void> => {
    this.manageAlarm();
  };

  private checkAllReady = () => {
    const players = this.getRecordsOfType<IPlayer>("player");
    if (players.length === 0) return;
    const allReady = players.every((player) => player.isReady);
    if (allReady && !this.IsStarting) {
      const newAction = new TimedActionRecord({
        id: randomUUID(),
        countdown: 5000,
        action: {
          name: "start",
        },
      });
      this.addTimedAction(newAction);
      this.IsStarting = true;
    } else if (!allReady && this.IsStarting) {
      const timedActions = this.getRecordsOfType(
        "timedAction"
      ) as ITimedAction[];
      if (timedActions.length > 0) {
        for (const action of timedActions) {
          this.deleteRecord(action);
          const update: HistoryEntry<GameRecord> = {
            changes: {
              added: {},
              updated: {},
              removed: {
                [action.id]: action,
              },
            },
            source: "remote",
          };
          this.pendingUpdates.push({ clientId: "server", updates: [update] });
        }
      }
      this.IsStarting = false;
    }
  };

  private addTimedAction = (action: ITimedAction) => {
    const timedAction =
      (this.getRecordsOfType("timedAction")[0] as ITimedAction) ||
      (null as null);
    if (!timedAction) {
      this.room.storage.setAlarm(Date.now() + 1000);

      this.putRecord(action);
      const update: HistoryEntry<GameRecord> = {
        changes: {
          added: {
            [action.id]: action,
          },
          updated: {},
          removed: {},
        },
        source: "remote",
      };
      this.pendingUpdates.push({ clientId: "server", updates: [update] });
    }
  };

  private manageAlarm = () => {
    const timedAction =
      (this.getRecordsOfType("timedAction")[0] as ITimedAction) ||
      (null as null);

    const params = this.getRecordsOfType<ParamsRecord>("params") as IParams[];
    if (params.length === 0) return;
    const paramsRecord = params[0];
    if (!timedAction) return;
    const now = Date.now();

    if (timedAction.countdown <= 0) {
      console.log("actionDeleted", timedAction);

      const mutableParams = { ...paramsRecord }; // Create a mutable copy

      mutableParams.actualGameAction = timedAction.action;
      this.putRecord(mutableParams);

      this.deleteRecord(timedAction);
      const update: HistoryEntry<GameRecord> = {
        changes: {
          added: {},
          updated: {
            [mutableParams.id]: [paramsRecord, mutableParams],
          },
          removed: {
            [timedAction.id]: timedAction,
          },
        },
        source: "remote",
      };
      this.pendingUpdates.push({ clientId: "server", updates: [update] });
      this.applyAction(timedAction.action);
    } else {
      const mutableAction = { ...timedAction }; // Create a mutable copy
      mutableAction.countdown -= 1000;
      this.putRecord(mutableAction);
      const update: HistoryEntry<GameRecord> = {
        changes: {
          added: {},
          updated: {
            [mutableAction.id]: [timedAction, mutableAction],
          },
          removed: {},
        },
        source: "remote",
      };
      this.pendingUpdates.push({ clientId: "server", updates: [update] });
    }

    this.room.storage.setAlarm(now + 1000);
  };

  private applyAction = (action: ITimedAction["action"]) => {
    const players = this.getRecordsOfType<IPlayer>("player");
    const alivePlayers = players.filter(
      (player) => player.role?.isAlive === true
    );
    switch (action.name) {
      case "start": {
        this.IsStarting = false;
        this.isFirstTour = true;
        const params = this.getRecordsOfType<ParamsRecord>("params");
        if (params.length === 0) return;
        const paramsRecord = params[0];
        if (!paramsRecord) return;
        const newParams = { ...paramsRecord }; // Create a mutable copy
        newParams.page = "game";

        const shuffledRoles = this.mixRoles(paramsRecord.roles);

        players.forEach((player, index) => {
          const mutablePlayer = { ...player }; // Create a mutable copy
          let role = shuffledRoles[index] || null;
          if (role) {
            role.playerId = player.id;
          }
          mutablePlayer.role = role;
          this.putRecord(mutablePlayer);

          const update: HistoryEntry<GameRecord> = {
            changes: {
              added: {},
              updated: {
                [mutablePlayer.id]: [
                  player as IPlayer,
                  mutablePlayer as IPlayer,
                ],
              },
              removed: {},
            },
            source: "remote",
          };
          this.pendingUpdates.push({ clientId: "server", updates: [update] });
          this.teleportToWoodLog(player.id);
        });

        this.putRecord(newParams);

        const update: HistoryEntry<GameRecord> = {
          changes: {
            added: {},
            updated: {
              [newParams.id]: [paramsRecord, newParams],
            },
            removed: {},
          },
          source: "remote",
        };

        this.pendingUpdates.push({ clientId: "server", updates: [update] });
        this.addTimedAction(
          new TimedActionRecord({
            id: randomUUID(),
            countdown: 10000,
            action: { name: "sleep", who: "all" },
          })
        );
        break;
      }

      case "sleep": {
        const params = this.getRecordsOfType<ParamsRecord>("params");
        if (params.length === 0) return;
        const paramsRecord = params[0];
        if (!paramsRecord) return;

        switch (action.who) {
          case "all": {
            if (!paramsRecord.isDay) {
              break;
            }

            if (this.isFirstTour) {
              this.tourAgenda = TOUR_DE_PREPARATION.concat(TOUR_NORMAL);
            } else {
              this.tourAgenda = TOUR_NORMAL;
            }

            const newParams = { ...paramsRecord }; // Create a mutable copy
            newParams.isDay = false;

            this.putRecord(newParams);
            const update: HistoryEntry<GameRecord> = {
              changes: {
                added: {},
                updated: {
                  [newParams.id]: [paramsRecord, newParams],
                },
                removed: {},
              },
              source: "remote",
            };
            this.pendingUpdates.push({ clientId: "server", updates: [update] });

            alivePlayers.forEach((player) => {
              const mutablePlayer = { ...player }; // Create a mutable copy
              mutablePlayer.state = { name: "sleeping" };
              this.teleportToWoodLog(player.id);
              this.putRecord(mutablePlayer);

              const update: HistoryEntry<GameRecord> = {
                changes: {
                  added: {},
                  updated: {
                    [mutablePlayer.id]: [player, mutablePlayer],
                  },
                  removed: {},
                },
                source: "remote",
              };
              this.pendingUpdates.push({
                clientId: "server",
                updates: [update],
              });
            });
            this.wakeUpNextRole();
            break;
          }
          case "amoureux": {
            const lovers = alivePlayers.filter((player) => player.loveIn);
            lovers.forEach((lover) => {
              const mutableLover = { ...lover }; // Create a mutable copy
              mutableLover.state = { name: "sleeping" };
              this.teleportToWoodLog(lover.id);
              this.putRecord(mutableLover);

              const update: HistoryEntry<GameRecord> = {
                changes: {
                  added: {},
                  updated: {
                    [mutableLover.id]: [lover, mutableLover],
                  },
                  removed: {},
                },
                source: "remote",
              };
              this.pendingUpdates.push({
                clientId: "server",
                updates: [update],
              });
            });
            this.wakeUpNextRole();
            break;
          }

          default: {
            const PlayerWithRoles = alivePlayers.filter((p) => {
              p.role?.name === action.who;
            }) as IPlayer[];
            PlayerWithRoles.forEach((player) => {
              const mutablePlayer = { ...player }; // Create a mutable copy
              mutablePlayer.state = { name: "sleeping" };
              this.teleportToWoodLog(player.id);
              this.putRecord(mutablePlayer);

              const update: HistoryEntry<GameRecord> = {
                changes: {
                  added: {},
                  updated: {
                    [mutablePlayer.id]: [player, mutablePlayer],
                  },
                  removed: {},
                },
                source: "remote",
              };
              this.pendingUpdates.push({
                clientId: "server",
                updates: [update],
              });
            });
            this.wakeUpNextRole();
            break;
          }
        }
        break;
      }
      case "wake": {
        const params = this.getRecordsOfType<ParamsRecord>("params");
        if (params.length === 0) return;
        const paramsRecord = params[0] as IParams;
        if (!paramsRecord) return;

        switch (action.who) {
          case "all": {
            if (paramsRecord.isDay) {
              break;
            }
            this.isFirstTour = false;

            const newParams = { ...paramsRecord }; // Create a mutable copy
            newParams.isDay = true;
            this.putRecord(newParams);
            const update: HistoryEntry<GameRecord> = {
              changes: {
                added: {},
                updated: {
                  [newParams.id]: [paramsRecord, newParams],
                },
                removed: {},
              },
              source: "remote",
            };
            this.pendingUpdates.push({ clientId: "server", updates: [update] });

            this.bilanDeLaNuit();
            alivePlayers.forEach((player) => {
              const mutablePlayer = { ...player }; // Create a mutable copy
              mutablePlayer.state = { name: "waiting" };
              this.putRecord(mutablePlayer);

              const update: HistoryEntry<GameRecord> = {
                changes: {
                  added: {},
                  updated: {
                    [mutablePlayer.id]: [player, mutablePlayer],
                  },
                  removed: {},
                },
                source: "remote",
              };
              this.pendingUpdates.push({
                clientId: "server",
                updates: [update],
              });
            });

            if (this.happenningBy) {
              this.addTimedAction(
                new TimedActionRecord({
                  id: randomUUID(),
                  countdown: 2000,
                  action: {
                    name: "happeningBegin",
                    who: this.happenningBy.who,
                  },
                })
              );
            } else {
              this.checkIfWin();
              alivePlayers.forEach((player) => {
                const mutablePlayer = { ...player }; // Create a mutable copy
                mutablePlayer.state = { name: "idle" };
                this.putRecord(mutablePlayer);

                const update: HistoryEntry<GameRecord> = {
                  changes: {
                    added: {},
                    updated: {
                      [mutablePlayer.id]: [player, mutablePlayer],
                    },
                    removed: {},
                  },
                  source: "remote",
                };
                this.pendingUpdates.push({
                  clientId: "server",
                  updates: [update],
                });
              });
              this.addTimedAction(
                new TimedActionRecord({
                  id: randomUUID(),
                  countdown: 10000,
                  action: { name: "voteBegin" },
                })
              );
            }

            break;
          }
          case "amoureux": {
            const lovers = alivePlayers.filter((player) => player.loveIn);
            lovers.forEach((lover) => {
              const mutableLover = { ...lover }; // Create a mutable copy
              mutableLover.state = { name: "idle" };
              this.putRecord(mutableLover);

              const update: HistoryEntry<GameRecord> = {
                changes: {
                  added: {},
                  updated: {
                    [mutableLover.id]: [lover, mutableLover],
                  },
                  removed: {},
                },
                source: "remote",
              };
              this.pendingUpdates.push({
                clientId: "server",
                updates: [update],
              });
            });
            this.addTimedAction(
              new TimedActionRecord({
                id: randomUUID(),
                countdown: 15000,
                action: { name: "sleep", who: "amoureux" },
              })
            );
            break;
          }

          default: {
            const PlayerWithRoles = alivePlayers.filter((p) => {
              p.role?.name === action.who;
            }) as IPlayer[];
            PlayerWithRoles.forEach((player) => {
              const mutablePlayer = { ...player }; // Create a mutable copy
              mutablePlayer.state = { name: "idle" };
              this.putRecord(mutablePlayer);

              const update: HistoryEntry<GameRecord> = {
                changes: {
                  added: {},
                  updated: {
                    [mutablePlayer.id]: [player, mutablePlayer],
                  },
                  removed: {},
                },
                source: "remote",
              };
              this.pendingUpdates.push({
                clientId: "server",
                updates: [update],
              });
            });
            this.addTimedAction(
              new TimedActionRecord({
                id: randomUUID(),
                countdown: TEMPS_PAR_JOUEUR_MS,
                action: { name: "sleep", who: action.who },
              })
            );
            break;
          }
        }

        break;
      }
      case "happeningBegin": {
        switch (action.who) {
          case "chasseur": {
            this.addTimedAction(
              new TimedActionRecord({
                id: randomUUID(),
                countdown: 15000,
                action: { name: "happeningEnd", who: "chasseur" },
              })
            );
            break;
          }
        }
        break;
      }
      case "happeningEnd": {
        switch (action.who) {
          case "chasseur": {
            const chasseur = alivePlayers.find(
              (player) => player.role?.name === "chasseur"
            );
            if (chasseur) {
              const mutableChasseur = { ...chasseur }; // Create a mutable copy
              mutableChasseur.state = { name: "die" };
              mutableChasseur.role!.isAlive = false;
              this.putRecord(mutableChasseur);

              const update: HistoryEntry<GameRecord> = {
                changes: {
                  added: {},
                  updated: {
                    [mutableChasseur.id]: [chasseur, mutableChasseur],
                  },
                  removed: {},
                },
                source: "remote",
              };
              this.pendingUpdates.push({
                clientId: "server",
                updates: [update],
              });
            }
          }
          default: {
            break;
          }
        }
        const nextGenState =
          this.happenningBy?.genStateBefore === "wake"
            ? { name: "voteBegin" }
            : { name: "sleep", who: "all" };
        const nextDuration =
          this.happenningBy?.genStateBefore === "wake" ? 10000 : 2000;
        this.happenningBy = null;
        this.checkIfWin();
        this.addTimedAction(
          new TimedActionRecord({
            id: randomUUID(),
            countdown: nextDuration,
            action: nextGenState as GeneralAction,
          })
        );
        break;
      }
      case "voteBegin": {
        alivePlayers.forEach((player) => {
          const mutablePlayer = { ...player }; // Create a mutable copy
          mutablePlayer.state = { name: "waiting" };
          this.teleportToWoodLog(player.id);
          this.putRecord(mutablePlayer);

          const update: HistoryEntry<GameRecord> = {
            changes: {
              added: {},
              updated: {
                [mutablePlayer.id]: [player, mutablePlayer],
              },
              removed: {},
            },
            source: "remote",
          };
          this.pendingUpdates.push({
            clientId: "server",
            updates: [update],
          });
        });
        this.addTimedAction(
          new TimedActionRecord({
            id: randomUUID(),
            countdown: TEMPS_DE_VOTE_MS,
            action: { name: "voteEnd" },
          })
        );
        break;
      }
      case "voteEnd": {
        alivePlayers.forEach((player) => {
          const mutablePlayer = { ...player }; // Create a mutable copy
          mutablePlayer.state = { name: "idle" };
          this.putRecord(mutablePlayer);

          const update: HistoryEntry<GameRecord> = {
            changes: {
              added: {},
              updated: {
                [mutablePlayer.id]: [player, mutablePlayer],
              },
              removed: {},
            },
            source: "remote",
          };
          this.pendingUpdates.push({
            clientId: "server",
            updates: [update],
          });
        });

        const votes = this.getRecordsOfType("vote") as IVote[];
        if (votes.length === 0) {
          this.addTimedAction(
            new TimedActionRecord({
              id: randomUUID(),
              countdown: 10000,
              action: { name: "sleep", who: "all" },
            })
          );
          return;
        }

        const voteCounts: Record<string, number> = {};

        votes.forEach((vote) => {
          if (vote.targetId) {
            voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
          }
        });

        const maxVotes = Math.max(...Object.values(voteCounts));
        const playersWithMaxVotes = Object.entries(voteCounts)
          .filter(([_, count]) => count === maxVotes)
          .map(([playerId]) => playerId);

        if (playersWithMaxVotes.length === 1) {
          const playerIdToKill = playersWithMaxVotes[0];
          const playerToKill = this.getRecordById<IPlayer>(playerIdToKill);

          if (playerToKill && playerToKill.record) {
            const mutablePlayerToKill = { ...playerToKill.record };

            if (mutablePlayerToKill.role?.name === "chasseur") {
              this.happenningBy = {
                genStateBefore: "voteEnd",
                who: "chasseur",
              };
              mutablePlayerToKill.state = { name: "revenge" };
            } else {
              mutablePlayerToKill.state = { name: "die" };
              if (mutablePlayerToKill.role) {
                mutablePlayerToKill.role.isAlive = false;
              }
            }

            // Create a mutable copy
            if (mutablePlayerToKill.role) {
              mutablePlayerToKill.role.isAlive = false;
            }
            const update: HistoryEntry<GameRecord> = {
              changes: {
                added: {},
                updated: {
                  [mutablePlayerToKill.id]: [
                    playerToKill.record,
                    mutablePlayerToKill,
                  ],
                },
                removed: {},
              },
              source: "remote",
            };

            this.pendingUpdates.push({ clientId: "server", updates: [update] });
          }
        }

        votes.forEach((vote) => {
          const mutableVote = { ...vote }; // Create a mutable copy
          this.deleteRecord(mutableVote);
          const update: HistoryEntry<GameRecord> = {
            changes: {
              added: {},
              updated: {},
              removed: {
                [mutableVote.id]: mutableVote,
              },
            },
            source: "remote",
          };
          this.pendingUpdates.push({ clientId: "server", updates: [update] });
        });

        if (this.happenningBy) {
          this.addTimedAction(
            new TimedActionRecord({
              id: randomUUID(),
              countdown: 2000,
              action: {
                name: "happeningBegin",
                who: this.happenningBy.who,
              },
            })
          );
        } else {
          this.checkIfWin();
          this.addTimedAction(
            new TimedActionRecord({
              id: randomUUID(),
              countdown: 10000,
              action: { name: "sleep", who: "all" },
            })
          );
        }

        break;
      }

      case "end": {
        const params = this.getRecordsOfType<ParamsRecord>("params");
        if (params.length === 0) return;
        const paramsRecord = params[0];
        if (!paramsRecord) return;
        const newParams = { ...paramsRecord }; // Create a mutable copy
        newParams.page = "end";
        this.putRecord(newParams);
        const update: HistoryEntry<GameRecord> = {
          changes: {
            added: {},
            updated: {
              [newParams.id]: [paramsRecord, newParams],
            },
            removed: {},
          },
          source: "remote",
        };
        this.pendingUpdates.push({ clientId: "server", updates: [update] });

        players.forEach((player) => {
          const mutablePlayer = { ...player }; // Create a mutable copy
          mutablePlayer.state = { name: "idle" };
          mutablePlayer.role = null;
          mutablePlayer.targetBy = [];

          this.putRecord(mutablePlayer);

          const update: HistoryEntry<GameRecord> = {
            changes: {
              added: {},
              updated: {
                [mutablePlayer.id]: [player, mutablePlayer],
              },
              removed: {},
            },
            source: "remote",
          };
          this.pendingUpdates.push({
            clientId: "server",
            updates: [update],
          });
        });
        break;
      }
      case "return lobby": {
        const params = this.getRecordsOfType<ParamsRecord>("params");
        if (params.length === 0) return;
        const paramsRecord = params[0];
        if (!paramsRecord) return;
        const newParams = { ...paramsRecord }; // Create a mutable copy
        newParams.page = "lobby";
        this.putRecord(newParams);
        const update: HistoryEntry<GameRecord> = {
          changes: {
            added: {},
            updated: {
              [newParams.id]: [paramsRecord, newParams],
            },
            removed: {},
          },
          source: "remote",
        };
        this.pendingUpdates.push({ clientId: "server", updates: [update] });

        players.forEach((player) => {
          const mutablePlayer = { ...player }; // Create a mutable copy
          mutablePlayer.state = { name: "idle" };
          mutablePlayer.role = null;
          mutablePlayer.targetBy = [];

          this.putRecord(mutablePlayer);

          const update: HistoryEntry<GameRecord> = {
            changes: {
              added: {},
              updated: {
                [mutablePlayer.id]: [player, mutablePlayer],
              },
              removed: {},
            },
            source: "remote",
          };
          this.pendingUpdates.push({
            clientId: "server",
            updates: [update],
          });
        });

        break;
      }

      default: {
        break;
      }
    }
  };

  private wakeUpNextRole = () => {

    
    let next = this.tourAgenda[0];

    if (next === "amoureux") {
      const lovers = this.getRecordsOfType<IPlayer>("player")
        .filter((player) => player.loveIn)
        .filter((player) => player.role?.isAlive === true);
      if (lovers.length > 0) {
        this.addTimedAction(
          new TimedActionRecord({
            id: randomUUID(),
            countdown: 5000,
            action: { name: "wake", who: "amoureux" },
          })
        );
        this.tourAgenda.shift();
        return;
      } else {
        this.tourAgenda.shift();
        next = this.tourAgenda[0];
      }
    }

    if (next === "all") {
      this.addTimedAction(
        new TimedActionRecord({
          id: randomUUID(),
          countdown: 5000,
          action: { name: "wake", who: "all" },
        })
      );
      this.tourAgenda.shift();
      return;
    }

    const alivePlayers = this.getRecordsOfType<IPlayer>("player").filter(
      (player) => player.role?.isAlive === true
    );
    let nextRole = alivePlayers.find((player) => player.role?.name === next);

    while (!nextRole && this.tourAgenda.length > 0) {
      this.tourAgenda.shift();
      next = this.tourAgenda[0];
      if (next === "amoureux") {
        const lovers = this.getRecordsOfType<IPlayer>("player")
          .filter((player) => player.loveIn)
          .filter((player) => player.role?.isAlive === true);
        if (lovers.length > 0) {
          this.addTimedAction(
            new TimedActionRecord({
              id: randomUUID(),
              countdown: 5000,
              action: { name: "wake", who: "amoureux" },
            })
          );
          this.tourAgenda.shift();
          return;
        } else {
          this.tourAgenda.shift();
          next = this.tourAgenda[0];
        }
      }
      if (next === "all") {
        this.addTimedAction(
          new TimedActionRecord({
            id: randomUUID(),
            countdown: 5000,
            action: { name: "wake", who: "all" },
          })
        );
        this.tourAgenda.shift();
        return;
      }
      nextRole = alivePlayers.find((player) => player.role?.name === next);
    }

    if (nextRole) {
      this.addTimedAction(
        new TimedActionRecord({
          id: randomUUID(),
          countdown: 5000,
          action: { name: "wake", who: next },
        })
      );
      this.tourAgenda.shift();
    }
  };

  private teleportToWoodLog = (playerId: IPlayer["id"]) => {
    console.log("teleportToWoodLog", playerId);
    const playerRecord = this.getRecordById<IPlayer>(
      playerId
    ) as ServerRecord<IPlayer>;
    if (!playerRecord) return;
    const woodLogs = this.getRecordsOfType<IWoodLog>("wood_log") as IWoodLog[];
    if (woodLogs.length === 0) return;
    const woodLog = woodLogs.find((log) => log.ownerId === playerId);
    if (!woodLog) return;
    const player = playerRecord.record as IPlayer;
    const mutablePlayer = { ...player } as IPlayer; // Create a mutable copy
    mutablePlayer.position = woodLog.position;
    this.putRecord(mutablePlayer);
    const update: HistoryEntry<GameRecord> = {
      changes: {
        added: {},
        updated: {
          [mutablePlayer.id]: [player, mutablePlayer],
        },
        removed: {},
      },
      source: "remote",
    };
    this.pendingUpdates.push({ clientId: "server", updates: [update] });
  };

  private mixRoles = (roles: RoleRecordType[]) => {
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    return roles;
  };

  private checkIfWin = () => {
    const params = this.getRecordsOfType<ParamsRecord>("params");
    if (params.length === 0) return;
    const paramsRecord = params[0];
    if (!paramsRecord) return;
    const players = this.getRecordsOfType<IPlayer>("player");
    if (players.length === 0) return;
    const alivePlayers = players.filter(
      (player) => player.role?.isAlive === true
    );
    const TeamWolf = alivePlayers.filter(
      (player) => player.role?.team === "wolf"
    );
    const TeamVillager = alivePlayers.filter(
      (player) => player.role?.team === "village"
    );

    // console.log("TeamWolf", TeamWolf);
    // console.log("TeamVillager", TeamVillager);

    if (TeamWolf.length === 0 && TeamVillager.length === 0) {
      const newParams = { ...paramsRecord }; // Create a mutable copy

      newParams.winner = "none";
      this.putRecord(newParams);
      const update: HistoryEntry<GameRecord> = {
        changes: {
          added: {},
          updated: {
            [newParams.id]: [paramsRecord, newParams],
          },
          removed: {},
        },
        source: "remote",
      };
      this.pendingUpdates.push({ clientId: "server", updates: [update] });
      this.addTimedAction(
        new TimedActionRecord({
          id: randomUUID(),
          countdown: 100,
          action: { name: "end" },
        })
      );
    } else if (TeamWolf.length === 0) {
      const newParams = { ...paramsRecord }; // Create a mutable copy
      newParams.winner = "village";
      this.putRecord(newParams);
      const update: HistoryEntry<GameRecord> = {
        changes: {
          added: {},
          updated: {
            [newParams.id]: [paramsRecord, newParams],
          },
          removed: {},
        },
        source: "remote",
      };
      this.pendingUpdates.push({ clientId: "server", updates: [update] });
      this.addTimedAction(
        new TimedActionRecord({
          id: randomUUID(),
          countdown: 100,
          action: { name: "end" },
        })
      );
    } else if (TeamVillager.length === 0) {
      const newParams = { ...paramsRecord }; // Create a mutable copy
      newParams.winner = "wolf";

      this.putRecord(newParams);
      const update: HistoryEntry<GameRecord> = {
        changes: {
          added: {},
          updated: {
            [newParams.id]: [paramsRecord, newParams],
          },
          removed: {},
        },
        source: "remote",
      };
      this.pendingUpdates.push({ clientId: "server", updates: [update] });
      this.addTimedAction(
        new TimedActionRecord({
          id: randomUUID(),
          countdown: 100,
          action: { name: "end" },
        })
      );
    }
  };

  private bilanDeLaNuit = () => {
    const players = this.getRecordsOfType<IPlayer>("player");
    if (players.length === 0) return;
    const alivePlayers = players.filter(
      (player) => player.role?.isAlive === true
    );
    const targetedAlivePlayers = alivePlayers.filter(
      (player) => player.targetBy && player.targetBy.length > 0
    );
    targetedAlivePlayers.forEach((player) => {
      const mutablePlayer = { ...player }; // Create a mutable copy
      if (mutablePlayer.role?.name === "chasseur") {
        mutablePlayer.state = { name: "revenge" };
        this.happenningBy = {
          genStateBefore: "wake",
          who: "chasseur",
        };
      } else {
        mutablePlayer.state = { name: "die" };
        if (mutablePlayer.role) {
          mutablePlayer.role.isAlive = false;
        }
      }

      mutablePlayer.targetBy = [];

      this.putRecord(mutablePlayer);

      const update: HistoryEntry<GameRecord> = {
        changes: {
          added: {},
          updated: {
            [mutablePlayer.id]: [player, mutablePlayer],
          },
          removed: {},
        },
        source: "remote",
      };
      this.pendingUpdates.push({
        clientId: "server",
        updates: [update],
      });
    });
  };

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
    });

    this.clients.forEach((clientId, connection) => {
      if (connection.readyState === WebSocket.CLOSED) {
        this.clients.delete(connection);
        this.removePlayer(clientId);
      }
    });
    const params = this.getRecordsOfType<ParamsRecord>("params");
    if (params.length > 0) {
      const paramsRecord = params[0];
      if (paramsRecord.page === "lobby") {
        this.checkAllReady();
      }
    }

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
