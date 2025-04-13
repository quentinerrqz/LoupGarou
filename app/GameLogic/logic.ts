export type User = {
  name: string | undefined;
  id: string | undefined;
  isReady: boolean | undefined;
  isSpectator: boolean | undefined;
  isAdmin: boolean | undefined;
};

export type Player = {
  id: string | undefined;
  startPosition: { x: number; y: number } | undefined;
  startTime: number | undefined;
  dirangle: number | undefined;
  velocity: number | undefined;
};
export type Game = {
  users: User[];
  players: Player[];
  page: "lobby" | "play" | "end";
  time: number;
  countdown: number;
};

export type Action = {
  type: string;
  userId?: string;
  time?: number;
  isReady?: boolean;
  page?: string;
  name?: string;

  rolesSketch?: string;

  position?: { x: number; y: number };
  dirAngle?: number;
  velocity?: number;
};

export const gameUpdater = (state: Game, action: Action) => {
  switch (action.type) {
    // Ajout d'un utilisateur
    case "addUser": {
      const isSpectator = state.page !== "lobby";
      const name = randomName();
      const newUser: User = {
        name,
        id: action.userId,
        isReady: false,
        isSpectator,
        isAdmin: false,
      };
      const newPlayer: Player = {
        id: action.userId,
        startPosition: { x: 0, y: 0 },
        startTime: 0,
        dirangle: 0,
        velocity: 0,
      };
      return {
        ...state,
        users: [...state.users, newUser],
        players: [...state.players, newPlayer],
      };
    }
    // Suppression d'un utilisateur
    case "removeUser": {
      return {
        ...state,
        users: state.users.filter(
          (u) => action.userId && u.id !== action.userId
        ),
        players: state.players.filter(
          (p) => action.userId && p.id !== action.userId
        ),
      };
    }

    // case "updateUser": {
    //   return {
    //     ...state,
    //     users: state.users.map((u) =>
    //       u.id === action.userId ? { ...u, ...action } : u
    //     ),
    //   };
    // }

    // Permets de changer la page du jeu
    case "updatePage": {
      return {
        ...state,
        page: action.page,
      };
    }
    // Permets de changer le temps de la partie ( en secondes ), cette fonction n'est actuellement pas utilisée mais permettrait, par exemple, de gérer le passage de la nuit au jour
    case "updateTime": {
      return {
        ...state,
        time: action.time,
      };
    }
    case "move": {
      const userId = action.userId;
      const dirAngle = action.dirAngle;
      const velocity = action.velocity;
      const startPosition = action.position;
      const startTime = action.time;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === userId
            ? {
                ...p,
                startPosition: startPosition,
                dirangle: dirAngle,
                velocity: velocity,
                startTime: startTime,
              }
            : p
        ),
      };
      // return {
      //   ...state,
      //   players: state.players.map((p) =>
      //     p.id === action.userId
      //       ? {
      //           ...p,
      //           position: {
      //             x:
      //               (p.position?.x ?? 0) +
      //               Math.cos((action.dirAngle ?? 0) * (Math.PI / 180)) * 9,
      //             y:
      //               (p.position?.y ?? 0) +
      //               Math.sin((action.dirAngle ?? 0) * (Math.PI / 180)) * 9,
      //           },
      //         }
      //       : p
      //   ),
      // };
    }

    default:
      return state;
  }
};

// Etat initial du jeu
export const initialgameState: Game = {
  users: [],
  players: [],
  page: "lobby",
  time: 0,
  countdown: 0,
};

// Fonction qui génère un nom aléatoire
const randomName = () => {
  const names = [
    "Alice",
    "Bob",
    "Charlie",
    "David",
    "Eve",
    "Frank",
    "Grace",
    "Heidi",
    "Ivan",
    "Judy",
    "Mallory",
    "Oscar",
    "Peggy",
    "Trent",
    "Walter",
    "Zoe",
    "Alex",
    "Bella",
    "Chris",
    "Diana",
    "Ethan",
    "Fiona",
    "George",
    "Hannah",
    "Isaac",
    "Julia",
    "Kevin",
    "Linda",
    "Mike",
    "Nina",
    "Oliver",
    "Pam",
    "Quinn",
    "Rachel",
    "Steve",
    "Tina",
    "Ursula",
    "Victor",
    "Wendy",
    "Xander",
    "Yvonne",
    "Zack",
  ];
  return names[Math.floor(Math.random() * names.length)];
};
