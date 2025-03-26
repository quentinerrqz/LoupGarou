

export type User = {
  name: string | undefined;
  id: string | undefined;
  isReady: boolean | undefined;
  isSpectator: boolean | undefined;
  isAdmin?: boolean;
  position: { x: number; y: number };
};

export type Game = {
  users: User[];
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
  random?: boolean;
  position?: { x: number; y: number };
  direction?: string;
};

export const gameUpdater = (state: Game, action: Action) => {
  switch (action.type) {
    // Ajout d'un utilisateur
    case "addUser": {
      const isSpectator = state.page !== "lobby";
      return {
        ...state,
        users: [
          ...state.users,
          {
            name: randomName(),
            id: action.userId,
            isReady: false,
            isSpectator: isSpectator,
            isAdmin: state.users.length === 0,
            position: {x: 0, y: 0},
          },
        ],
      };
    }
    // Suppression d'un utilisateur
    case "removeUser": {
      return {
        ...state,
        users: state.users.filter(
          (u) => action.userId && u.id !== action.userId
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
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.userId
            ? {
                ...u,
                position: {
                  x: u.position.x + (action.direction === "right" ? 10 : action.direction === "left" ? -10 : 0),
                  y: u.position.y + (action.direction === "down" ? 10 : action.direction === "up" ? -10 : 0),
                },
              }
            : u
        ),
      };
    }


    case "updatePosition": {
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.userId ? { ...u, position: action.position } : u
        ),
      };
    }
    default:
      return state;
  }
};

// Etat initial du jeu
export const initialgameState = {
  users: [],
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
