import { GameRecord } from "./schema";
import { HistoryEntry } from "./types";

export class Store<T extends GameRecord> {
  private records: { [key: string]: T } = {};
  private schema: any;
  private updater: () => void;
  private listenCallback: ((data: any) => void) | null = null;
  constructor({ schema, updater }: { schema: any; updater: () => void }) {
    this.schema = schema;
    this.records = {} as { [key: string]: T };
    this.updater = updater;
    this.listenCallback = () => {
      // noop
    };
  }

  loadSnapshot(snapshot: any) {
    this.records = snapshot.store;
  }

  put(updates: any[]) {
    for (const update of updates) {
      this.records[update.id] = update;
    }
    this.updater();
  }

  get(id: string) {
    return this.records[id];
  }

  clear() {
    this.records = {} as { [key: string]: T };
    this.updater();
  }

  update(id: string, update: Partial<T>) {
    if (this.records[id]) {
      const oldRecord = this.records[id];
      const newRecord = { ...oldRecord, ...update };
      this.records[id] = newRecord;

      this.updater();

      this.triggerCallback([
        {
          changes: {
            added: {},
            updated: { [id]: [oldRecord, newRecord] },
            removed: {},
          },
          source: "user",
        },
      ]);
    }
  }

  updatePublicly(updates: any[]) {
    const updatesList: HistoryEntry<GameRecord>[] = [];

    for (const update of updates) {
      const oldRecord = this.records[update.id];
      const newRecord = { ...oldRecord, ...update };
      this.records[update.id] = newRecord;

      const entry: HistoryEntry<GameRecord> = {
        changes: {
          added: {},
          updated: { [update.id]: [oldRecord, newRecord] },
          removed: {},
        },
        source: "user",
      };
      updatesList.push(entry);
    }
    this.updater();

    this.triggerCallback(updatesList);
  }

  remove(ids: string[]) {
    for (const id of ids) {
      delete this.records[id];
    }
    this.updater();
  }
  mergeRemoteChanges(callback: () => void) {
    callback();
  }

  query = {
    records: (type: string) => {
      return Object.values(this.records).filter(
        (record) => record.typeName === type
      );
    },
  };

  getSnapshot() {
    return {
      store: this.records,
      schema: this.schema,
    };
  }
  listen(callback: (data: any) => void) {
    this.listenCallback = callback.bind(this);
  }
  triggerCallback(list: HistoryEntry<GameRecord>[]) {
    if (this.listenCallback) {
      this.listenCallback(list); // Utilise la référence actuelle de listenCallback
    }
  }
}
