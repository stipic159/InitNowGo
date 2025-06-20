import { Logger, sck1 } from "../lib";

type UserJID = number;

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

// Вспомогательная функция для обработки операций
async function handleEcoOperation(
  action: () => Promise<any>, // Разрешены любые промисы
  successLog: string,
  errorContext: string
): Promise<void> {
  try {
    await action(); // Ожидаем выполнение операции
    Logger.success(successLog);
  } catch (e) {
    Logger.error(`Ошибка в ${errorContext}: ${e}`);
    throw e;
  }
}

export const eco: EconomyOperations = {
  giveMyMsg: (jid, mentionedJid, amount) =>
    handleEcoOperation(
      async () => {
        await sck1.updateOne({ id: jid }, { $inc: { msg: -amount } });
        await sck1.updateOne({ id: mentionedJid }, { $inc: { msg: amount } });
      },
      `[ECO] Пользователь ${jid} передал пользователю ${mentionedJid} - ${amount} MSG`,
      "giveMyMsg"
    ),

  takeMsg: (jid, amount) =>
    handleEcoOperation(
      async () => {
        await sck1.updateOne({ id: jid }, { $inc: { msg: -amount } });
      },
      `[ECO] Пользователю ${jid} списано ${amount} MSG`,
      "takeMsg"
    ),

  takeLvl: (jid, amount) =>
    handleEcoOperation(
      async () => {
        await sck1.updateOne({ id: jid }, { $inc: { level: -amount } });
      },
      `[ECO] Пользователю ${jid} списано ${amount} уровней`,
      "takeLvl"
    ),

  giveMsg: (jid, amount) =>
    handleEcoOperation(
      async () => {
        await sck1.updateOne({ id: jid }, { $inc: { msg: amount } });
      },
      `[ECO] Пользователю ${jid} выдано ${amount} MSG`,
      "giveMsg"
    ),

  setMsg: (jid, amount) =>
    handleEcoOperation(
      async () => {
        await sck1.updateOne({ id: jid }, { $set: { msg: amount } });
      },
      `[ECO] Пользователю ${jid} установлено ${amount} MSG`,
      "setMsg"
    ),

  setLvl: (jid, amount) =>
    handleEcoOperation(
      async () => {
        await sck1.updateOne({ id: jid }, { $set: { level: amount } });
      },
      `[ECO] Пользователю ${jid} установлен ${amount} уровень`,
      "setLvl"
    ),

  giveLvl: (jid, amount) =>
    handleEcoOperation(
      async () => {
        await sck1.updateOne({ id: jid }, { $inc: { level: amount } });
      },
      `[ECO] Пользователю ${jid} выдано ${amount} уровней`,
      "giveLvl"
    ),
};
