// import { RolePower } from "../types";

import { IPower } from "../types";
import { IPlayer } from "./PlayerRecord";

export interface IRole {
  typeName: "role";
  id: string;
  name: string;
  team: string;
  isAlive: boolean;
  playerId: IPlayer["id"] | null;
  created_at: number;
}

export class RoleRecord implements IRole {
  typeName = "role" as const;
  id: IRole["id"];
  name: IRole["name"];
  created_at: number;
  team: IRole["team"] = "village";
  isAlive: IRole["isAlive"];
  playerId: IRole["id"] | null = null;

  constructor({
    id,
    name,
    team = "village",
    playerId = null,
  }: {
    id?: IRole["id"];
    name: IRole["name"];
    team?: IRole["team"];
    playerId?: IPlayer["id"] | null;
  }) {
    this.id = id || "";
    this.name = name;
    this.created_at = Date.now();
    this.isAlive = true;
    this.playerId = playerId || null;
    this.team = team;
    if (!this.id) {
      this.generateId();
    }
  }
  private generateId() {
    this.id = Math.random().toString(36).substring(2, 9);
  }
}

export class Sorciere extends RoleRecord {
  description: string;
  power: IPower["sorcière"];
  constructor({ id }: { id?: IRole["id"] }) {
    super({ id, name: "sorcière" });
    this.description =
      "La sorcière peut sauver un joueur la nuit et/ou éliminer un autre joueur. Elle gagne avec le village.";
    this.power = {
      potions: { heal: 1, poison: 1 },
    };
  }
}

export class LoupGarou extends RoleRecord {
  description: string;
  power: IPower["loup-garou"];
  constructor({ id }: { id?: IRole["id"] }) {
    super({ id, name: "loup-garou", team: "wolf" });
    this.description =
      "Le loup-garou élimine un joueur la nuit. Il gagne avec les loups-garous.";
    this.power = {};
  }
}

export class Chasseur extends RoleRecord {
  description: string;
  power: IPower["chasseur"];
  constructor({ id }: { id?: IRole["id"] }) {
    super({ id, name: "chasseur" });
    this.description =
      "Le chasseur peut éliminer un joueur s'il est éliminé. Il gagne avec le village.";
    this.power = {};
  }
}

export class Cupidon extends RoleRecord {
  description: string;
  power: IPower["cupidon"];
  constructor({ id }: { id?: IRole["id"] }) {
    super({ id, name: "cupidon" });
    this.description =
      "Cupidon lie deux joueurs ensemble. Si l'un meurt, l'autre meurt aussi. Il gagne avec le village.";
    this.power = {};
  }
}

export class Voyante extends RoleRecord {
  description: string;
  power: IPower["voyante"];
  constructor({ id }: { id?: IRole["id"] }) {
    super({ id, name: "voyante" });
    this.description =
      "La voyante peut voir le rôle d'un joueur la nuit. Elle gagne avec le village.";
    this.power = {
      vision: 1,
    };
  }
}

export class PetiteFille extends RoleRecord {
  description: string;
  power: IPower["petite-fille"];
  constructor({ id }: { id?: IRole["id"] }) {
    super({ id, name: "petite-fille" });
    this.description =
      "La petite fille peut voir les loups-garous la nuit. Elle gagne avec le village.";
    this.power = {};
  }
}

export class Villageois extends RoleRecord {
  description: string;
  power: IPower["villageois"];
  constructor({ id }: { id?: IRole["id"] }) {
    super({ id, name: "villageois" });
    this.description =
      "Le villageois n'a pas de pouvoir spécial. Il gagne avec le village.";
    this.power = {};
  }
}

export const rolesChoiceList = [
  "sorcière",
  "loup-garou",
  "chasseur",
  "cupidon",
  "voyante",
  "petite-fille",
  "villageois",
] as const;

export type RoleRecordType =
  | Sorciere
  | LoupGarou
  | Chasseur
  | Cupidon
  | Voyante
  | PetiteFille
  | Villageois;

export const classicRoles: RoleRecordType[] = [
  new Villageois({}),
  new Sorciere({}),
  new Voyante({}),
  new LoupGarou({}),
  new LoupGarou({}),
  new Chasseur({}),
  new Cupidon({}),
  new Villageois({}),
  new LoupGarou({}),
  new Villageois({}),
];
