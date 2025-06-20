import sck1 from "../utils/database/user.db";
import { Logger } from "../utils/Logger.utils";

// Тип для идентификаторов пользователей (JID)
type UserJID = number;

// Интерфейс для экономических операций
export interface EconomyOperations {
  giveMyMsg: (
    jid: UserJID,
    mentionedJid: UserJID,
    amount: number
  ) => Promise<void>;
  takeMsg: (jid: UserJID, amount: number) => Promise<void>;
  takeLvl: (jid: UserJID, amount: number) => Promise<void>;
  giveMsg: (jid: UserJID, amount: number) => Promise<void>;
  setMsg: (jid: UserJID, amount: number) => Promise<void>;
  setLvl: (jid: UserJID, amount: number) => Promise<void>;
  giveLvl: (jid: UserJID, amount: number) => Promise<void>;
}

export const eco: EconomyOperations = {
  giveMyMsg: async function (jid, mentionedJid, amount) {
    try {
      await sck1.updateOne({ id: jid }, { $inc: { msg: -amount } });
      await sck1.updateOne({ id: mentionedJid }, { $inc: { msg: amount } });
      Logger.success(
        `[ECO] Пользователь ${jid} передал пользователю ${mentionedJid} - ${amount} MSG`
      );
    } catch (e) {
      Logger.error(`Ошибка в giveMyMsg: ${e}`);
      throw e;
    }
  },

  takeMsg: async function (jid, amount) {
    try {
      await sck1.updateOne({ id: jid }, { $inc: { msg: -amount } });
      Logger.success(`[ECO] Пользователю ${jid} списано ${amount} MSG`);
    } catch (e) {
      Logger.error(`Ошибка в takeMsg: ${e}`);
      throw e;
    }
  },

  takeLvl: async function (jid, amount) {
    try {
      await sck1.updateOne({ id: jid }, { $inc: { level: -amount } });
      Logger.success(`[ECO] Пользователю ${jid} списано ${amount} уровней`);
    } catch (e) {
      Logger.error(`Ошибка в takeLvl: ${e}`);
      throw e;
    }
  },

  giveMsg: async function (jid, amount) {
    try {
      await sck1.updateOne({ id: jid }, { $inc: { msg: amount } });
      Logger.success(`[ECO] Пользователю ${jid} выдано ${amount} MSG`);
    } catch (e) {
      Logger.error(`Ошибка в giveMsg: ${e}`);
      throw e;
    }
  },

  setMsg: async function (jid, amount) {
    try {
      await sck1.updateOne({ id: jid }, { msg: amount });
      Logger.success(`[ECO] Пользователю ${jid} установлено ${amount} MSG`);
    } catch (e) {
      Logger.error(`Ошибка в setMsg: ${e}`);
      throw e;
    }
  },

  setLvl: async function (jid, amount) {
    try {
      await sck1.updateOne({ id: jid }, { level: amount });
      Logger.success(`[ECO] Пользователю ${jid} установлен ${amount} уровень`);
    } catch (e) {
      Logger.error(`Ошибка в setLvl: ${e}`);
      throw e;
    }
  },

  giveLvl: async function (jid, amount) {
    try {
      await sck1.updateOne({ id: jid }, { $inc: { level: amount } });
      Logger.success(`[ECO] Пользователю ${jid} выдано ${amount} уровней`);
    } catch (e) {
      Logger.error(`Ошибка в giveLvl: ${e}`);
      throw e;
    }
  },
};
