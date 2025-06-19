import { getMovingUserPlayer } from "../../shared/getMovingUserPlayerPosition";
import { getRespawnPosition } from "../../shared/getRespawnPosition";
import { updatePlayer } from "../../shared/updatePlayer";
import { Box } from "../Box";
import { Vec } from "../Vec";
import { CLICK_DISTANCE, FRAME_LENGTH, MOVING_KEYS } from "./constants";
import { GameRecord, gameSchema } from "./schema";
import { IMessage } from "./schema/MessageRecord";
import { IParams } from "./schema/ParamsRecord";
import { IPlayer, PlayerRecord } from "./schema/PlayerRecord";
import { ITimedAction } from "./schema/timedActionRecord";
import { IVote, VoteRecord } from "./schema/VoteRecord";
import { IWoodLog } from "./schema/WoodLogRecord";
import { getLocalPlayer, persistLocalPlayer } from "./storage";
import { Store } from "./store";
import { syncStore } from "./sync";
import { GameInputs, MovingKeysState } from "./types";
import { v4 } from "uuid";
import { CameraMe } from "./camera";

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

  public scale = 1;

  private camera = new CameraMe(new Vec(0, 0));

  public get cameraPosition() {
    return this.camera.position;
  }
  public set cameraPosition(position: Vec) {
    this.camera.setPosition(position);
  }

  public inputs: GameInputs = {
    pointer: { name: "up", point: new Vec(0, 0) },
    movingkeys: {
      ARROWDOWN: false,
      ARROWUP: false,
      ARROWLEFT: false,
      ARROWRIGHT: false,
      W: false,
      A: false,
      S: false,
      D: false,
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

  public vote(by: IPlayer["id"], targetId: IPlayer["id"]) {
    const playerAlreadyVoted = this.votes.find((v) => v.by === by);
    const IsPlayerAlreadyVotedByUser = this.votes.find(
      (v) => v.targetId === targetId && v.by === by
    );
    if (IsPlayerAlreadyVotedByUser) {
      this.store.delete(IsPlayerAlreadyVotedByUser.id);
    } else if (playerAlreadyVoted) {
      this.store.update(playerAlreadyVoted.id, {
        targetId,
      });
    } else {
      const vote = new VoteRecord({
        id: v4(),
        targetId,
        by,
      });
      this.store.add(vote);
    }
  }

  /* ------------------- Coordinates ------------------ */

  public screenToWorld = (screen: Vec) => {
    const { x, y } = this.cameraPosition;
    return new Vec(screen.x / this.scale - x, screen.y / this.scale - y);
  };

  public worldToScreen = (world: Vec) => {
    const { x, y } = this.cameraPosition;
    // Convert the world coordinates to screen coordinates
    return new Vec((world.x + x) * this.scale, (world.y + y) * this.scale);
  };

  public toVirtualX(xReal: number) {
    const { x } = this.cameraPosition;
    return (xReal + x) * this.scale;
  }
  public toVirtualY(yReal: number) {
    const { y } = this.cameraPosition;
    return (yReal + y) * this.scale;
  }
  public toRealX(xVirtual: number) {
    const { x } = this.cameraPosition;
    return xVirtual / this.scale - x;
  }
  public toRealY(yVirtual: number) {
    const { y } = this.cameraPosition;
    return yVirtual / this.scale - y;
  }

  public virtualHeight() {
    const { height } = this.screenSize;
    return (height ?? 0) / this.scale;
  }

  public virtualWidth() {
    const { width } = this.screenSize;
    return (width ?? 0) / this.scale;
  }

  public zoom = (scale: number, point: Vec) => {
    this.scale = scale;
    const { w, h } = this.screenSize;
    const virtualPoint = this.worldToScreen(point);
    // Update the screen size to keep the point at the same position
    this.pointCameraOn(new Vec(virtualPoint.x + w / 2, virtualPoint.y + h / 2));
  };

  /* ------------------- Camera ------------------- */

  public pointCameraOn = (screen: Vec) => {
    const { w, h } = this.screenSize;
    const { x, y } = this.cameraPosition;
    const offsetX = x - (screen.x - w / 2) / this.scale;
    const offsetY = y - (screen.y - h / 2) / this.scale;
    this.screenSize = new Box(offsetX, offsetY, w, h);
  };

  /* --------------------- Events --------------------- */

  public onPointerMove = (point: Vec) => {
    this.inputs.pointer.point = point;
  };

  public onPointerDown = () => {
    const { pointer: currentPointer } = this.inputs;

    const params = this.gameParams;
    const isPlayerAlive = this.player.role?.isAlive;
    if (!isPlayerAlive) return;
    if (params?.actualGameAction?.name === "voteBegin") {
      const alivePlayers = this.players.filter((p) => p.role && p.role.isAlive);
      const pointedPlayer = alivePlayers.find((p) => {
        const playerPos = new Vec(p.position.x, p.position.y);
        const dist = Vec.Dist(currentPointer.point, playerPos);
        return dist < CLICK_DISTANCE;
      });
      if (pointedPlayer) {
        this.inputs.pointer = {
          name: "down",
          point: currentPointer.point.clone(),
          downPoint: currentPointer.point.clone(),
        };
        this.vote(this.playerId, pointedPlayer.id);
      }
    }
    // const { pointer: currentPointer } = this.inputs;
    // if (
    //   Vec.Dist(this.inputs.pointer.point, this.player.position) < CLICK_DISTANCE
    // ) {
    //   this.inputs.pointer = {
    //     name: "dragging",
    //     point: currentPointer.point.clone(),
    //     downPoint: currentPointer.point.clone(),
    //     offset: Vec.Sub(this.inputs.pointer.point, this.player.position),
    //   };
    // } else {
    //   this.inputs.pointer = {
    //     name: "down",
    //     point: currentPointer.point.clone(),
    //     downPoint: currentPointer.point.clone(),
    //   };
    // }

    // switch (this.player.state.name) {
    //   case "idle": {
    //     if (this.inputs.pointer.name === "dragging") {
    //       this.updatePlayer({
    //         state: {
    //           name: "moving",
    //         },
    //       });
    //     }
    //     break;
    //   }
    // }
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
    const keyUpper = key.toUpperCase();
    if (MOVING_KEYS.includes(keyUpper)) {
      this.inputs.movingkeys[keyUpper as keyof MovingKeysState] = true;

      if (this.player.state.name === "idle")
        this.updatePlayer({
          state: {
            name: "moving",
          },
        });
    }
  };
  public onKeyUp = (key: string) => {
    const keyUpper = key.toUpperCase();

    if (MOVING_KEYS.includes(keyUpper)) {
      const { movingkeys } = this.inputs;
      movingkeys[keyUpper as keyof MovingKeysState] = false;
      if (this.player.state.name === "moving") {
        let isStillKey = false;
        for (let key in movingkeys) {
          if (movingkeys[key as keyof MovingKeysState]) {
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
              const { movingkeys } = this.inputs;

              for (let key in movingkeys) {
                if (movingkeys[key as keyof MovingKeysState]) {
                  resultPlayer = getMovingUserPlayer(
                    this.screenSize,
                    frames,
                    player,
                    movingkeys
                  );
                  resultIsPrivate = false;
                  break;
                }
              }

              break;
            }
            case "PLAYER_RECOVERED": {
              const { movingkeys } = this.inputs;

              for (let key in movingkeys) {
                if (movingkeys[key as keyof MovingKeysState]) {
                  resultPlayer = {
                    ...player,
                    state: {
                      name: "moving",
                    },
                  };

                  // Update the player direction / position
                  resultPlayer = getMovingUserPlayer(
                    this.screenSize,
                    frames,
                    resultPlayer,
                    movingkeys
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
