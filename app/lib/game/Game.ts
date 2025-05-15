import { getMovingUserPlayer } from "../../shared/getMovingUserPlayerPosition";
import { getRespawnPosition } from "../../shared/getRespawnPosition";
import { updatePlayer } from "../../shared/updatePlayer";
import { Box } from "../Box";
import { Vec, VecModel } from "../Vec";
import { CLICK_DISTANCE, FRAME_LENGTH } from "./constants";
import { GameRecord, gameSchema } from "./schema";
import { IMessage } from "./schema/MessageRecord";
import { IParams } from "./schema/ParamsRecord";
import { IPlayer, PlayerRecord } from "./schema/PlayerRecord";
import { ITimedAction } from "./schema/timedActionRecord";
import { IVote } from "./schema/VoteRecord";
import { IWoodLog } from "./schema/WoodLogRecord";
import { getLocalPlayer, persistLocalPlayer } from "./storage";
import { Store } from "./store";
import { syncStore } from "./sync";
import { GameInputs, KeysState } from "./types";

const localPlayer = getLocalPlayer();

export class Game {
  private store: Store<GameRecord>;

  constructor({
    roomId,
    onReady,
    onUpdate,
  }: {
    roomId: string;
    onReady: () => void;
    onUpdate: (g: Game) => void;
  }) {
    this.store = new Store<GameRecord>({
      schema: gameSchema,
      updater: () => {
        // noop

        this.player;
        this.players;
        this.woodLogs;
        this.messages;
        this.gameParams;
        this.timedAction;

        onUpdate(this);
      },
    });
    // Clear any initial data
    this.store.clear();

    // Connect to the server

    const unsubs = syncStore(this.store, localPlayer.id, roomId, {
      onPing: (ms) => {
        this.ping = ms;
      },
      onReady: () => {
        // When connected and synced, add the player
        this.store.add(
          new PlayerRecord({
            ...localPlayer,
            position: getRespawnPosition(localPlayer, this.screenSize).toJson(),
            state: { name: "idle" },
          })
        );

        setTimeout(() => {
          this.status = "ready";
          onReady?.();
        }, 500);
      },
    });
    this.disposables.push(...unsubs);
  }

  private disposables: (() => void)[] = [];

  public dispose = () => {
    for (const dispose of this.disposables) {
      dispose();
    }
  };

  public status = "loading" as "loading" | "ready";

  public ping = 0 as number;

  public get woodLogs() {
    return this.store.query.records("wood_log") as IWoodLog[];
  }

  public get messages() {
    return this.store.query.records("message") as IMessage[];
  }

  get playerId() {
    return localPlayer.id;
  }

  public get gameParams() {
    return this.store.query.records("params")[0] as IParams;
  }
  public set currentPage(page: string) {
    this.store.setPage(page);
  }

  public get timedAction() {
    const timedAction = this.store.query.records("timedAction")[0] || null;
    return timedAction as ITimedAction | null;
  }

  public get votes() {
    return this.store.query.records("vote") as IVote[];
  }

  public get players() {
    return this.store.query.records("player") as IPlayer[];
  }

  public get player() {
    return this.store.get(this.playerId)! as IPlayer;
  }

  public screenSize = new Box(0, 0, window.innerWidth, window.innerHeight);

  public inputs: GameInputs = {
    pointer: { name: "up", point: new Vec(0, 0) },
    keys: {
      ArrowDown: false,
      ArrowUp: false,
      ArrowLeft: false,
      ArrowRight: false,
    },
  };

  public NSEW = {
    NS: 0,
    EW: 0,
  };

  updatePlayer(props: Partial<IPlayer>) {
    this.store.update(this.playerId, props);
  }

  public setCosestPlayer = (player: IPlayer | null) => {
    this.store.update(this.playerId, {
      closestPlayer: player,
    });
  };

  public targetToKill = (byRole: string, target: IPlayer) => {
    const playerAlreadyTargeted = this.players.find(
      (p) => p.targetBy.length > 0 && p.targetBy.includes(byRole)
    );
    if (playerAlreadyTargeted) {
      this.store.update(playerAlreadyTargeted.id, {
        targetBy: playerAlreadyTargeted.targetBy.filter((p) => p !== byRole),
      });
    }

    this.store.update(target.id, {
      targetBy: [...target.targetBy, this.player.role?.name || ""],
    });
  };

  public vote = (vote: IVote) => {
    this.store.add(vote);
  };

  public updateParams = (params: Partial<IParams>) => {
    this.store.update(this.gameParams.id, params);
  };

  public updatePlayerName = (name: string) => {
    this.store.update(this.playerId, {
      name,
    });
  };

  public updateIsReady = () => {
    this.store.update(this.playerId, {
      isReady: !this.player.isReady,
    });
  };

  public addMessage = (message: IMessage) => {
    this.store.add(message);
  };

  /* ------------------- Coordinates ------------------ */

  public screenToWorld = (screen: Vec) => {
    const { x, y, w, h } = this.screenSize;
    return new Vec(screen.x - (x + w / 2), screen.y - (y + h / 2));
  };

  public worldToScreen = (world: Vec) => {
    const { x, y, w, h } = this.screenSize;
    // Convert the world coordinates to screen coordinates
    return new Vec(world.x + (x + w / 2), world.y + (y + h / 2));
  };

  /* --------------------- Events --------------------- */

  public onPointerMove = (point: Vec) => {
    this.inputs.pointer.point = point;
  };

  public onPointerDown = () => {
    const { pointer: currentPointer } = this.inputs;
    if (
      Vec.Dist(this.inputs.pointer.point, this.player.position) < CLICK_DISTANCE
    ) {
      this.inputs.pointer = {
        name: "dragging",
        point: currentPointer.point.clone(),
        downPoint: currentPointer.point.clone(),
        offset: Vec.Sub(this.inputs.pointer.point, this.player.position),
      };
    } else {
      this.inputs.pointer = {
        name: "down",
        point: currentPointer.point.clone(),
        downPoint: currentPointer.point.clone(),
      };
    }

    switch (this.player.state.name) {
      case "idle": {
        if (this.inputs.pointer.name === "dragging") {
          this.updatePlayer({
            state: {
              name: "moving",
            },
          });
        }
        break;
      }
    }
  };

  public onPointerUp = () => {
    const { pointer: currentPointer } = this.inputs;
    this.inputs.pointer = {
      name: "up",
      point: currentPointer.point.clone(),
    };

    const { state } = this.player;
    switch (state.name) {
      case "moving": {
        this.updatePlayer({
          state: { name: "idle" },
        });

        break;
      }
    }
  };

  public onPointerEnter = () => {
    // noop
  };

  public onPointerLeave = () => {
    const { pointer: currentPointer } = this.inputs;

    this.inputs.pointer = {
      name: "up",
      point: currentPointer.point.clone(),
    };
  };

  public onKeyDown = (key: string) => {
    this.inputs.keys[key as keyof KeysState] = true;

    if (this.player.state.name === "idle")
      this.updatePlayer({
        state: {
          name: "moving",
        },
      });
  };

  public onKeyUp = (key: string) => {
    const { keys } = this.inputs;
    keys[key as keyof KeysState] = false;

    if (this.player.state.name === "moving") {
      let isStillKey = false;
      for (let key in keys) {
        if (keys[key as keyof KeysState]) {
          isStillKey = true;
          break;
        }
      }
      if (!isStillKey) {
        this.updatePlayer({
          state: {
            name: "idle",
          },
        });
      }
    }
  };

  /* ---------------------- Tick ---------------------- */

  public persist() {
    persistLocalPlayer(this.player);
  }

  public tick(elapsed: number) {
    const frames = elapsed / FRAME_LENGTH;

    if (this.status !== "ready") return;

    const recordsToUpdatePrivately: GameRecord[] = [];
    const recordsToUpdatePublicly: GameRecord[] = [];
    const { players, playerId } = this;

    // Update the players
    for (const initialPlayer of players) {
      const { player, notes, isPrivate } = updatePlayer(
        frames,
        initialPlayer,
        // players,
        {
          name: "client",
          playerId,
          screenSize: this.screenSize,
        }
      );

      let resultPlayer = player;
      let resultIsPrivate = isPrivate;

      if (notes.length > 0) {
        for (const note of notes) {
          switch (note) {
            case "PLAYER_MOVED": {
              const { keys } = this.inputs;

              for (let key in keys) {
                if (keys[key as keyof KeysState]) {
                  resultPlayer = getMovingUserPlayer(frames, player, keys);
                  resultIsPrivate = false;
                  break;
                }
              }

              // if (ifKeysPressed) {
              //   resultPlayer = getMovingUserPlayer(frames, player, keys);
              //   resultIsPrivate = false;
              // }
              break;
            }
            case "PLAYER_RECOVERED": {
              const { keys } = this.inputs;

              for (let key in keys) {
                if (keys[key as keyof KeysState]) {
                  resultPlayer = {
                    ...player,
                    state: {
                      name: "moving",
                      // direction: Vec.From(pointer.offset).normalize(),
                    },
                  };

                  // Update the player direction / position
                  resultPlayer = getMovingUserPlayer(
                    frames,
                    resultPlayer,
                    keys
                  );
                  resultIsPrivate = false;
                  break;
                }
              }

              break;
            }
          }
        }
      }

      // Update the player if it's changed
      if (initialPlayer !== resultPlayer) {
        if (resultIsPrivate) {
          // ...some player updates are private (i.e. decreasing the recovery of a player)
          recordsToUpdatePrivately.push(resultPlayer);
        } else {
          recordsToUpdatePublicly.push(resultPlayer);
        }
      }
    }

    // Apply the private changes (these will not be sent to the server)
    if (recordsToUpdatePrivately.length > 0) {
      this.store.mergeRemoteChanges(() => {
        this.store.put(recordsToUpdatePrivately);
      });
    }

    // Apply the public changes (these will be sent to the server)
    if (recordsToUpdatePublicly.length > 0) {
      this.store.updatePublicly(recordsToUpdatePublicly);
    }
  }
}
