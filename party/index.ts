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
import {
  classicRoles,
  IRole,
  RoleRecordType,
} from "@/app/lib/game/schema/RoleRecord";
import {
  ITimedAction,
  TimedActionRecord,
} from "@/app/lib/game/schema/timedActionRecord";
import { IVote } from "@/app/lib/game/schema/VoteRecord";
import next from "next";
import { game } from "@/app/ui/GameProvider";
import { Vec } from "@/app/lib/Vec";

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

  // ALARM MANAGEMENT //////////////////////////////////////

  private addTimedAction = (action: ITimedAction) => {
    const timedAction =
      (this.getRecordsOfType("timedAction")[0] as ITimedAction) ||
      (null as null);
    if (!timedAction) {
      this.room.storage.setAlarm(Date.now() + 1000);

      this.updateChanges({
        methode: "add",
        to: action,
      });
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
      this.updateChanges({
        methode: "update",
        from: timedAction,
        to: mutableAction,
      });
    }

    this.room.storage.setAlarm(now + 1000);
  };

  /// THE GOD FUNCTION ////////////////////////////////////

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

  private applyAction = (action: ITimedAction["action"]) => {
    const players = this.getRecordsOfType<IPlayer>("player");
    const alivePlayers = players.filter(
      (player) => player.role?.isAlive === true
    );
    const params = this.getRecordsOfType<ParamsRecord>("params");
    if (params.length === 0) return;
    const paramsRecord = params[0];
    if (!paramsRecord) return;
    switch (action.name) {
      case "start": {
        this.IsStarting = false;
        this.isFirstTour = true;

        const shuffledRoles = this.mixRoles(paramsRecord.roles);

        players.forEach((player, index) => {
          const mutablePlayer = { ...player }; // Create a mutable copy
          let role = shuffledRoles[index] || null;
          if (role) {
            role.playerId = player.id;
          }
          mutablePlayer.role = role;

          this.updateChanges({
            methode: "update",
            from: player,
            to: mutablePlayer,
          });
          this.teleportToWoodLog(player.id);
        });

        this.updateParams({ page: "game" });
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
        switch (action.who) {
          case "all": {
            if (this.isFirstTour) {
              this.tourAgenda = TOUR_DE_PREPARATION.concat(TOUR_NORMAL);
            } else {
              this.tourAgenda = TOUR_NORMAL.slice();
            }

            this.updateParams({ isDay: false });

            this.updatePlayers({
              newPlayer: ({ player }) => {
                return { ...player, state: { name: "sleeping" } };
              },
              options: { who: "all", isAlive: true, teleport: true },
            });
            this.wakeUpNextRole();
            break;
          }
          case "amoureux": {
            this.updatePlayers({
              newPlayer: ({ player }) => {
                return { ...player, state: { name: "sleeping" } };
              },
              options: { who: "amoureux", isAlive: true, teleport: true },
            });
            this.wakeUpNextRole();
            break;
          }

          default: {
            this.updatePlayers({
              newPlayer: ({ player }) => {
                return { ...player, state: { name: "sleeping" } };
              },
              options: { who: action.who, isAlive: true, teleport: true },
            });
            this.wakeUpNextRole();
            break;
          }
        }
        break;
      }

      case "wake": {
        switch (action.who) {
          case "all": {
            this.isFirstTour = false;

            this.updateParams({ isDay: true });

            this.bilanDeLaNuit();
            this.updatePlayers({
              newPlayer: ({ player }) => {
                return { ...player, state: { name: "waiting" } };
              },
              options: { who: "all", isAlive: true, teleport: true },
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
              this.updatePlayers({
                newPlayer: ({ player }) => {
                  return { ...player, state: { name: "idle" } };
                },
                options: { who: "all", isAlive: true, teleport: true },
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
            this.updatePlayers({
              newPlayer: ({ player }) => {
                return { ...player, state: { name: "idle" } };
              },
              options: { who: "amoureux", isAlive: true, teleport: true },
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
            this.updatePlayers({
              newPlayer: ({ player }) => {
                return { ...player, state: { name: "idle" } };
              },
              options: { who: action.who, isAlive: true, teleport: true },
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
            this.updatePlayers({
              newPlayer: ({ player }) => {
                return {
                  ...player,
                  state: { name: "die" },
                  role: player.role
                    ? Object.assign(
                        Object.create(Object.getPrototypeOf(player.role)),
                        { ...player.role, isAlive: false }
                      )
                    : null,
                };
              },
              options: { who: "chasseur" },
            });
            this.happenningBy = null;
            break;
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
        this.updatePlayers({
          newPlayer: ({ player }) => {
            return { ...player, state: { name: "waiting" } };
          },
          options: { who: "all", isAlive: true, teleport: true },
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
        this.updatePlayers({
          newPlayer: ({ player }) => {
            return { ...player, state: { name: "idle" } };
          },
          options: { who: "all", isAlive: true, teleport: true },
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
            this.updateChanges({
              methode: "update",
              from: playerToKill.record,
              to: mutablePlayerToKill,
            });
          }
        }

        votes.forEach((vote) => {
          const mutableVote = { ...vote }; // Create a mutable copy
          this.updateChanges({
            methode: "remove",
            from: vote,
            to: mutableVote,
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
        this.updateParams({ page: "end" });

        players.forEach((player) => {
          const mutablePlayer = { ...player }; // Create a mutable copy
          mutablePlayer.state = { name: "idle" };
          mutablePlayer.role = null;
          mutablePlayer.targetBy = [];

          this.updateChanges({
            methode: "update",
            from: player,
            to: mutablePlayer,
          });
        });
        break;
      }

      case "return lobby": {
        this.updateParams({ page: "lobby" });
        this.IsStarting = false;
        this.tourAgenda = [];
        this.happenningBy = null;
        this.isFirstTour = true;

        this.updatePlayers({
          newPlayer: ({ player }) => {
            return {
              ...player,
              state: { name: "idle" },
              role: null,
              targetBy: [],
            };
          },
        });

        break;
      }

      default: {
        break;
      }
    }
  };

  private updateChanges = ({
    methode,
    from,
    to,
  }: {
    methode: "add" | "update" | "remove";
    from?: GameRecord;
    to: GameRecord;
  }) => {
    const added = methode === "add" ? { [to.id]: to } : {};
    const updated =
      methode === "update" && from
        ? { [to.id]: [from, to] as [GameRecord, GameRecord] }
        : {};
    const removed = methode === "remove" ? { [to.id]: to } : {};

    if (methode === "add" || methode === "update") {
      this.putRecord(to);
    } else if (methode === "remove") {
      this.deleteRecord(to);
    }

    const update: HistoryEntry<GameRecord> = {
      changes: {
        added: { ...added },
        updated: {
          ...updated,
        },
        removed: {
          ...removed,
        },
      },
      source: "remote",
    };
    this.pendingUpdates.push({ clientId: "server", updates: [update] });
  };

  // MANAGEMENT FUNCTIONS ////////////////////

  private updateParams = (params: Partial<IParams>) => {
    const paramsRecord = this.getRecordsOfType<ParamsRecord>("params")[0];
    if (!paramsRecord) return;

    const newParams = { ...paramsRecord, ...params }; // Create a mutable copy
    this.updateChanges({
      methode: "update",
      from: paramsRecord,
      to: newParams,
    });
  };

  private updatePlayers = ({
    newPlayer,
    options,
  }: {
    newPlayer: ({
      player,
      index,
    }: {
      player: IPlayer;
      index: number;
    }) => Partial<IPlayer>;
    options?: {
      who?: IRole["name"] | "amoureux" | "all";
      isAlive?: boolean;

      teleport?: boolean;
    };
  }) => {
    if (!newPlayer) return;

    if (!options) options = { who: "all", teleport: false };
    const isAll = options.isAlive === undefined;

    const condition = (player: IPlayer) => {
      if (options.who === "all") {
        return isAll ? true : player.role?.isAlive === options.isAlive;
      }
      if (options.who === "amoureux") {
        return (
          player.loveIn &&
          (isAll ? true : player.role?.isAlive === options.isAlive)
        );
      }
      return (
        player.role?.name === options.who &&
        (isAll ? true : player.role?.isAlive === options.isAlive)
      );
    };

    const players = this.getRecordsOfType<IPlayer>("player").filter(condition);

    if (players.length === 0) return;
    players.forEach((player, index) => {
      const mutablePlayer = newPlayer({ player, index }) as IPlayer; // Create a mutable copy
      this.updateChanges({
        methode: "update",
        from: player,
        to: mutablePlayer,
      });
      if (options.teleport) {
        this.teleportToWoodLog(player.id);
      }
    });
  };

  /// GAME FUNCTIONS /////////////////////////////////////

  // WOOD LOGS //////////////////////////////////////

  private addWoodLog = (ownerId: IWoodLog["ownerId"]) => {
    if (!ownerId) return;

    const notOwnedWoodLogs = this.getRecordsOfType<IWoodLog>("wood_log").filter(
      (log) => log.ownerId === null
    );

    if (notOwnedWoodLogs.length > 0) {
      const woodLog = { ...notOwnedWoodLogs[0] }; // Create a mutable copy
      woodLog.ownerId = ownerId;
      this.updateChanges({
        methode: "update",
        from: notOwnedWoodLogs[0],
        to: woodLog,
      });
      return;
    } else {
      const woodLogRecord = new WoodLogRecord({
        id: randomUUID(),
        position: { x: Math.random() * 100, y: Math.random() * 100 },
        ownerId,
      });
      this.updateChanges({
        methode: "add",
        to: woodLogRecord,
      });
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
        this.updateChanges({
          methode: "remove",
          to: woodLog,
        });
        this.updateWoodLogsPosition();
      }
    } else {
      if (woodLog) {
        const mutableWoodLog = { ...woodLog }; // Create a mutable copy
        mutableWoodLog.ownerId = null;

        this.updateChanges({
          methode: "update",
          from: woodLog,
          to: mutableWoodLog,
        });
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
      this.updateChanges({
        methode: "update",
        from: woodLog,
        to: mutableWoodLog,
      });
    }
  };

  private teleportToWoodLog = (playerId: IPlayer["id"]) => {
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
    this.updateChanges({
      methode: "update",
      from: player,
      to: mutablePlayer,
    });
  };

  // PLAYERS //////////////////////////////////////

  private removePlayer(clientId: IPlayer["id"]) {
    const clientPlayerRecord = this.getRecordById(clientId);

    if (clientPlayerRecord) {
      const { record } = clientPlayerRecord;
      if (record) {
        this.updateChanges({
          methode: "remove",
          to: record,
        });
      }
    }
  }

  // ROLES //////////////////////////////////////

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

    this.updateParams({
      roles: newRoles,
    });
  };

  private mixRoles = (roles: RoleRecordType[]) => {
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    return roles;
  };
  private wakeUpNextRole = () => {
    console.log("wakeUpNextRole", this.tourAgenda);
    if (this.tourAgenda.length === 0) {
      this.addTimedAction(
        new TimedActionRecord({
          id: randomUUID(),
          countdown: 5000,
          action: { name: "wake", who: "all" },
        })
      );

      return;
    }

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
      console.log("nextRole", next);
    } else {
      this.addTimedAction(
        new TimedActionRecord({
          id: randomUUID(),
          countdown: 5000,
          action: { name: "wake", who: "all" },
        })
      );
      this.tourAgenda.shift();
      console.log("nextRole", "all");
    }
  };

  // GAME LOGIC //////////////////////////////////////

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
          this.updateChanges({
            methode: "remove",
            to: action,
          });
        }
      }
      this.IsStarting = false;
    }
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

    if (TeamWolf.length === 0 && TeamVillager.length === 0) {
      this.updateParams({ winner: "none" });
      this.addTimedAction(
        new TimedActionRecord({
          id: randomUUID(),
          countdown: 100,
          action: { name: "end" },
        })
      );
    } else if (TeamWolf.length === 0) {
      this.updateParams({ winner: "village" });
      this.addTimedAction(
        new TimedActionRecord({
          id: randomUUID(),
          countdown: 100,
          action: { name: "end" },
        })
      );
    } else if (TeamVillager.length === 0) {
      this.updateParams({ winner: "wolf" });
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

      this.updateChanges({
        methode: "update",
        from: player,
        to: mutablePlayer,
      });
    });
  };

  /// MANAGE RECORDS FUNCTIONS ///////////////////////////////////////

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

  /// ONTICK ///////////////////////////////////////

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
