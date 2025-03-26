import { Game, gameUpdater } from "@/app/GameLogic/logic";
import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // poll: Poll | undefined;
  gameState: Game | undefined;

  // S'exécute à chaque fois qu'un utilisateur envoie une requête HTTP
  async onRequest(req: Party.Request) {
    if (req.method === "POST") {
      const game = (await req.json()) as Game;
      // Initialisation de l'état de la partie / room
      this.gameState = game;
      this.savePoll();
    }

    if (this.gameState) {
      return new Response(JSON.stringify(this.gameState), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }

  //////////ON MESSAGE SYSTEME //////////

  // S'exécute à chaque fois qu'un utilisateur envoie un message ( avec socket.send ) au serveur
  async onMessage(message: string, sender: Party.Connection) {
    if (!this.gameState) return;
    const action = {
      ...JSON.parse(message),
      userId: sender.id,
    };
    // Mise à jour de l'état de la partie en fonction de l'action reçue
    this.gameState = gameUpdater(this.gameState, action) as Game;
    
    // Envoi du nouvel état de la partie à tous les joueurs
    this.room.broadcast(JSON.stringify(this.gameState));
    // Sauvegarde de l'état de la partie
    this.savePoll();
  }

  // S'exécute à chaque fois qu'une alarme est déclenchée
  // async onAlarm() {
  //   if (!this.gameState) return;

  //   // Gestion du compte à rebours
  //   if (this.gameState.countdown > 0) {
  //     this.gameState.countdown--;
  //     this.room.broadcast(JSON.stringify(this.gameState));
  //     this.room.storage.setAlarm(Date.now() + 1 * 1000);
  //   } else if (this.gameState.users.every((u) => u.isReady)) {
  //     // Si tout le monde est prêt et que le compte à rebours est terminé on attribue aléatoirement les rôles aux joueurs et on lance la partie
  //     this.gameState = gameUpdater(this.gameState, {
  //       type: "updatePage",
  //       page: "play",
  //     }) as Game;
  //     // Randomize la liste des rôles
  //     this.gameState = gameUpdater(this.gameState, {
  //       type: "mixRoles",
  //     }) as Game;
  //     // Fait correspondre un à un les rôles aux joueurs
  //     this.gameState = gameUpdater(this.gameState, {
  //       type: "updateUsersRoles",
  //     }) as Game;
  //     this.gameState = gameUpdater(this.gameState, {
  //       type: "updateUsersPositions",
  //       random: true,
  //     }) as Game;
  //     this.room.broadcast(JSON.stringify(this.gameState));
  //     this.savePoll();
  //   }
  // }

  //////////ON CONNECT ET ON CLOSE //////////

  // S'exécute à chaque fois qu'un joueur se connecte
  onConnect(
    connection: Party.Connection,
    { request }: Party.ConnectionContext
  ): void | Promise<void> {
    if (!this.gameState) return;

    const userId = connection.id;
    // let userId = request.headers.get("user-id");
    // if (!userId) {
    // userId = connection.id;
    // request.headers.set('user-id', userId);
    // }

    // const existingUser = this.gameState.users.find((user) => user === userId);

    // Ajout d'un joueur
    this.gameState.users = gameUpdater(this.gameState, {
      type: "addUser",
      userId: userId,
    }).users;

    this.room.broadcast(JSON.stringify(this.gameState));
  }

  // S'exécute à chaque fois qu'un joueur se déconnecte
  async onClose(connection: Party.Connection) {
    if (!this.gameState) return;
    this.gameState.users = gameUpdater(this.gameState, {
      type: "removeUser",
      userId: connection.id as string,
    }).users;

    this.room.broadcast(JSON.stringify(this.gameState));
  }

  // S'exécute lorsque la room est créée
  async onStart() {
    this.gameState = await this.room.storage.get<Game>("game");
  }
  //Permet de sauvegarder l'état de la partie
  async savePoll() {
    if (this.gameState) {
      await this.room.storage.put<Game>("game", this.gameState);
    }
  }

}

Server satisfies Party.Worker;
