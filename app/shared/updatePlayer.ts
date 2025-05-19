import { Box } from "../lib/Box";
import { IPlayer } from "../lib/game/schema/PlayerRecord";

export function updatePlayer(
  frames: number,
  player: IPlayer,
  // players: IPlayer[],
  context:
    | { name: "client"; playerId: IPlayer["id"]; screenSize: Box }
    | { name: "server" }
) {
  const { state } = player;

  const isClient = context.name === "client";
  const isClientUpdatingOwnPlayer = isClient && context.playerId === player.id;

  const result: {
    player: IPlayer;
    notes: string[];
    isPrivate: boolean;
  } = {
    player,
    notes: [],
    isPrivate: false,
  };

  switch (state.name) {
    case "idle": {
      // noop
      break;
    }
    case "moving": {
      // We should have already moved the player towards the pointer position

      switch (context.name) {
        case "client": {
          if (isClientUpdatingOwnPlayer) {
            result.isPrivate = true;
            result.notes.push("PLAYER_MOVED");
          }
          break;
        }
        case "server": {
          {
            result.isPrivate = true;
          }
          break;
        }
      }

      break;
    }
    case "waiting":{
      // noop
      break;
    }
    case "sleeping": {
      // noop
      break;
    }
    case "vote": {
      // noop
      break;
    }
    case "voted": {
      // noop
      break;
    }
   
    case "die": {
      // noop
      break;
    }
    case "revenge": {
      // noop
      break;
    }
    
    default: {
      throw Error(`Unhandled state`);
    }
  }

  return result;
}

// When recovered...
// // If the user is already clicking on the player, go to aiming
// const { pointer } = this.inputs
// if (pointer.name === 'dragging') {
// 	pointer.downPoint = Vec.From(player.position)
// 	pointer.offset = Vec.Sub(pointer.downPoint, player.position)

// 	result.player = {
// 		position,
// 		health,
// 		state: {
// 			name: 'aiming',
// 			power: 0,
// 			maxPower: 1,
// 		},
// 	}
