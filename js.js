/*
Приветствую, ты попал в чудесный лес!)
Здесь ты можешь задать базовые настройки для плагинов, т-то только будь осторожнее...
(Одно неправильное действия и прощайся с миром, а так же при создании нового параметра не забывай делать коментарии, только без ChathGPT...)
*/
const {
  generateWAMessageFromContent,
  delay,
} = require("@whiskeysockets/baileys");
const lastCommandUsageTimes = new Map();
const { sleep } = require("../lib/index");
const reply = require("../_reply");
const eco = require("./Eco");
const nodemailer = require("nodemailer");
const fs = require("fs").promises;
const path = require("path");
/**
 * @property {string} pattern - Паттерн плагина
 * @property {Array<string>} alias - Синонимы плагина
 * @property {string} desc - Описание плагина
 * @property {string} category - Категория плагина
 * @property {string} prefix - Префикс плагина
 * @property {number} level - Необходимый уровень для использования плагина
 * @property {number} price - Любая цена плагина
 * @property {number} priceMsg - Стоимость плагина в MSG
 * @property {number} priceLvl - Стоимость плагина в LVL
 * @property {boolean} isVip - Доступ только для VIP?
 * @property {boolean} isCreator - Доступ только для создателя?
 * @property {boolean} isGroupOnly - Доступ только в группе?
 * @property {boolean} isAdminGroup - Доступ только для администраторов группы?
 * @property {boolean} isPrivate - Доступ только в личных сообщениях?
 * @property {boolean} isBotAdminGroup - Доступ только если бот является администратором группы?
 * @property {boolean} onlyIsBotAccount - Доступ только с аккаунта бота?
 * @property {boolean} isTagRequired - Требуется ли тег кого-нибудь/чего-нибудь?
 * @property {boolean} nsfw - Контент 18+ ?
 * @property {number} cooldownTime -  Раз в сколько мс можно использовать команду?
 * @property {string} react - Реакция в начале выполнения плагина
 * @property {string} reactEnd - Реакция в конце выполнения плагина
 * @property {string} reactError - Реакция при ошибки выполнения плагина
 * @property {string} on - Обработчик событий
 */
class Plugins {
  static registry = new Map();
  static events = [];
  constructor({
    pattern, // Обязятельный пункт
    alias = [],
    desc = "описание отсутствует",
    category = undefined,
    prefix = PREFIX,
    level = 1,
    price = null,
    priceMsg = 0,
    priceLvl = 0,
    isVip = false,
    isCreator = false,
    isAdminGroup = false,
    isPrivate = false,
    isGroupOnly = false,
    isBotAdminGroup = false,
    onlyIsBotAccount = false,
    isTagRequired = false,
    nsfw = false,
    cooldownTime = 0,
    react = undefined,
    reactEnd = undefined,
    reactError = undefined,
    on = undefined,
  }) {
    Object.assign(this, {
      pattern,
      alias,
      desc,
      category,
      prefix,
      level,
      price,
      priceMsg,
      priceLvl,
      isVip,
      isCreator,
      isAdminGroup,
      isPrivate,
      isBotAdminGroup,
      onlyIsBotAccount,
      isGroupOnly,
      isTagRequired,
      nsfw,
      cooldownTime,
      react,
      reactEnd,
      reactError,
      on,
    });
    this.queue = []; // Очередь задач
    this.isProcessing = false; // Индикатор процесса

    this.transporter = nodemailer.createTransport({
      host: "smtp.yandex.ru",
      port: 587,
      secure: false,
      auth: MAILER_AUTH,
    });
    this.isValidMail = (text) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(text);
    };

    this.reply = reply;
    this.eco = eco;
    this.register();
  }

  // Метод для регистрации плагинов
  register() {
    if (this.pattern) {
      // Если есть pattern, регистрируем его в registry
      Plugins.registry.set(this.pattern, this);
      console.log(`Плагин зарегистрирован: ${this.pattern}`);
    } else {
      // Если pattern нет, добавляем в массив
      Plugins.events.push(this);
      console.log(
        `Плагин зарегистрирован без pattern(как обработчик событий): ${this.constructor.name}`
      );
    }
  }

  // Проверка доступа
  async checkAccess(Void, citel, { sck, sck1, users }) {
    const [DBUser, DBGroup] = await Promise.all([
      sck1.findOne({ id: citel.sender }),
      citel.chat.endsWith("@g.us")
        ? sck
            .findOne({ id: citel.chat })
            .then((group) => group || new sck({ id: citel.chat }).save())
        : null,
    ]);

    const allPlugins = Plugins.getAll();
    const { body } = citel;
    const cmdName = body.trim().split(" ")[0].toLowerCase();
    let matchingPlugin = null;

    for (const cmd of allPlugins) {
      const cmdPrefix =
        cmd.prefix && cmd.prefix !== "noPrefix" ? cmd.prefix : "";
      const isPrefixMatch =
        body.trim().startsWith(cmdPrefix) &&
        body.trim().length > cmdPrefix.length;
      const normalizedCmdName = isPrefixMatch
        ? body.slice(cmdPrefix.length).trim().split(" ")[0].toLowerCase()
        : cmdName;

      if (
        normalizedCmdName === cmd.pattern ||
        cmd.alias.includes(normalizedCmdName)
      ) {
        matchingPlugin = cmd;
        break;
      }
    }

    // Проверка на все остальное
    if (matchingPlugin) {
      if (matchingPlugin.cooldownTime) {
        const currentTime = Date.now();
        const lastConnectCommandTime =
          lastCommandUsageTimes.get(citel.chat) || 0;
        const timeElapsed = currentTime - lastConnectCommandTime;

        if (timeElapsed < matchingPlugin.cooldownTime) {
          const remainingTime = matchingPlugin.cooldownTime - timeElapsed;
          const remainingHours = Math.floor(remainingTime / 3600000);
          const remainingMinutes = Math.floor(
            (remainingTime % 3600000) / 60000
          );
          const remainingSeconds = Math.floor((remainingTime % 60000) / 1000);

          let remainingTimeString = "";
          if (remainingHours > 0)
            remainingTimeString += `${remainingHours} часов `;
          if (remainingMinutes > 0)
            remainingTimeString += `${remainingMinutes} минут `;
          if (remainingSeconds > 0)
            remainingTimeString += `${remainingSeconds} секунд`;

          const { key } = await citel.reply(
            `*❗ Ошибка*\n\n> Данная команда доступна раз в ${matchingPlugin.cooldownTime} мс, повторите попытку через - *${remainingTimeString}*`
          );
          await sleep(4000);
          await Void.sendMessage(citel.chat, { delete: key });
          return false;
        }

        lastCommandUsageTimes.set(citel.chat, currentTime);
      }

      if (matchingPlugin.isGroupOnly && !citel.isGroup) {
        await Void.sendMessage(
          citel.chat,
          {
            text: "",
            contextInfo: {
              externalAdReply: {
                title: "isGroupOnly",
                body: "Команда только для группы",
                thumbnailUrl:
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_RHtWW3jY0CTI-dpa5uqeX-brcegC_OTPlA&s",
                mediaType: 2,
                sourceUrl: "",
              },
            },
          },
          { quoted: citel }
        );
        return false;
      }

      if (matchingPlugin.isBotAdminGroup && !citel.isAdminsBot) {
        citel.reply("у меня нету админки"); // Проверка, является ли бот администратором
        return false;
      }

      if (
        matchingPlugin.isAdminGroup &&
        !citel.isAdminGroup &&
        !citel.isCreator
      ) {
        citel.reply(this.reply.ru.oftUsed.isAdmins); // Проверка, является ли пользователь администратором группы
        return false;
      }

      if (matchingPlugin.isPrivate && citel.isGroup) {
        citel.reply(this.reply.ru.system.isPrivate); // Команда доступна только в личных сообщениях
        return false;
      }

      if (matchingPlugin.isTagRequired && !users) {
        citel.reply(this.reply.ru.system.notUser); // Требуется тег пользователя
        return false;
      }

      if (DBUser) {
        if (matchingPlugin.isCreator && !citel.isCreator) {
          citel.react("❌");
          return false;
        }

        if (matchingPlugin.onlyIsBotAccount && citel.sender !== botNumber) {
          citel.reply(this.reply.ru.system.notBotNumber);
          return false;
        }

        if (matchingPlugin.level && DBUser.level < matchingPlugin.level) {
          citel.reply(
            this.reply.ru.system.notLvl(
              matchingPlugin.level,
              matchingPlugin.priceMsg
            )
          );
          return false;
        }
        if (
          matchingPlugin.isVip &&
          !DBUser.donate.subscriptions.some((sub) => sub.type === "VIP") &&
          !citel.isCreator
        ) {
          citel.reply(
            "Данная команда доступна только для VIP пользователей - .donate vip 1"
          );
          return false;
        }

        if (
          citel.isGroup &&
          matchingPlugin.nsfw &&
          (!DBGroup || !DBGroup.nsfw)
        ) {
          citel.react("❌");
          return false;
        }

        if (
          typeof matchingPlugin.priceMsg !== "string" &&
          matchingPlugin.priceMsg > 0
        ) {
          const error = await eco.takeMsg(citel.sender, {
            amount: matchingPlugin.priceMsg,
            reason: "cmd",
          });
          if (error) {
            const { key } = await Void.sendMessage(
              citel.chat,
              {
                text: `Вы не можете использовать данную команду, *т.к стоимость команды ${await eco.calculateAdjustedPrice(
                  matchingPlugin.priceMsg
                )} MSG -> у вас всего ${
                  DBUser.msg
                } MSG*\n\nСообщения накапливаются автоматически когда вы общаетесь в группах или же в личных сообщениях имея бота на аккаунте, а так же можно их купить -> .donate msg sum`,
              },
              { quoted: citel }
            );
            await sleep(10000);
            await Void.sendMessage(citel.chat, { delete: key });
            return false;
          }
        }
      }
      return true;
    }
    return false;
  }

  // Загрузка плагинов
  static async loadPlugins(dir) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);

      // Игнорирование .js файлов в текущей директории
      if (dir === __dirname && file.endsWith(".js")) continue;

      if (stat.isDirectory()) {
        await this.loadPlugins(filePath); // Рекурсивный вызов для подпапок
      } else if (file.endsWith(".js")) {
        try {
          const PluginClass = require(filePath);
          if (typeof PluginClass === "function") {
            new PluginClass();
          } else {
            console.warn(`Плагин ${filePath} не является конструктором.`);
          }
        } catch (error) {
          console.error(`Ошибка при загрузке плагина ${filePath}:`, error);
        }
      }
    }
  }

  // Функция для добавления задачи в очередь
  enqueueTask(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      console.log(
        "Задача добавлена в очередь. Текущая длина очереди:",
        this.queue.length
      );
      if (!this.isProcessing) {
        console.log("Очередь не обрабатывается. Запускаем процесс...");
        this.processQueue();
      }
    });
  }

  // Обработка очереди задач
  async processQueue() {
    if (this.isProcessing) {
      console.log("Очередь уже обрабатывается.");
      return;
    }
    if (this.queue.length === 0) {
      console.log("Очередь пуста. Нечего обрабатывать.");
      return;
    }

    this.isProcessing = true;
    console.log(
      "Обработка очереди началась. Длина очереди:",
      this.queue.length
    );

    while (this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift();
      console.log(
        "Задача извлечена из очереди. Осталось задач:",
        this.queue.length
      );

      try {
        console.log("Выполнение задачи началось...");
        await task();
        console.log("Задача успешно выполнена.");
        resolve();
      } catch (error) {
        console.error("Ошибка при выполнении задачи:", error);
        reject(error);
      }

      console.log("Задержка перед выполнением следующей задачи...");
      await delay(2000);
    }

    console.log("Все задачи выполнены. Очередь пуста.");
    this.isProcessing = false;
    if (this.queue.length > 0) {
      console.log("Найдены новые задачи в очереди. Перезапускаем обработку...");
      this.processQueue();
    }
  }
  static async reloadPlugin(filePath) {
    console.log(`Перезагрузка плагина: ${filePath}`);
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile() || !filePath.endsWith(".js")) {
        console.warn(`Файл ${filePath} не является допустимым плагином.`);
        return;
      }
      const modulePath = require.resolve(filePath);
      if (require.cache[modulePath]) {
        delete require.cache[modulePath];
      }

      const PluginClass = require(filePath);
      if (typeof PluginClass === "function") {
        new PluginClass();
      } else {
        console.warn(`Плагин ${filePath} не экспортирует функцию.`);
      }
    } catch (error) {
      console.error(`Ошибка при перезагрузке плагина ${filePath}:`, error);
    }
  }

  static clearRequireCache(filePath, processed = new Set()) {
    const modulePath = require.resolve(filePath);
    if (processed.has(modulePath)) return;
    processed.add(modulePath);
    if (require.cache[modulePath]) {
      for (const child of require.cache[modulePath].children) {
        Plugins.clearRequireCache(child.id, processed);
      }
      delete require.cache[modulePath];
    }
  }

  // Поиск 1-го плагина
  static find(citel) {
    const { body } = citel;
    const cmdName = body.trim().split(" ")[0].toLowerCase();
    const allPlugins = [...Plugins.registry.values()];
    let commandPlugin = allPlugins.find((cmd) => {
      const cmdPrefix =
        cmd.prefix && cmd.prefix !== "noPrefix" ? cmd.prefix : "";
      const isPrefixMatch =
        body.trim().startsWith(cmdPrefix) &&
        body.trim().length > cmdPrefix.length;

      const normalizedCmdName = isPrefixMatch
        ? body.slice(cmdPrefix.length).trim().split(" ")[0].toLowerCase()
        : cmdName;

      return (
        (isPrefixMatch &&
          (cmd.pattern === normalizedCmdName ||
            cmd.alias.includes(normalizedCmdName))) ||
        (cmd.prefix === "noPrefix" &&
          (cmd.pattern === cmdName || cmd.alias.includes(cmdName)))
      );
    });

    const events = Plugins.events.filter((p) => p.on === "body");
    return { commandPlugin, events };
  }

  // Получение всех плагинов
  static getAll() {
    return [...Plugins.registry.values()];
  }

  // Запуск начала проверки инструкций плагинов
  async run(Void, citel, params) {
    const hasAccess =
      citel.body.includes("setorientation") || citel.body.includes("ориентация")
        ? true
        : await this.checkAccess(Void, citel, params);
    if (hasAccess) {
      // Если доступ есть -> выполняем плагин.
      try {
        if (this.react) citel.react(this.react);
        await this.execute(Void, citel, params);
      } catch (err) {
        console.error(err);
        if (this.reactError) citel.react(this.reactError);
      } finally {
        if (this.reactEnd) citel.react(this.reactEnd);
      }
    }
  }

  // Метод execute здесь не трогаем (он на века написан), используем его только при написании плагинов
  async execute(Void, citel, params) {
    // Если метод не реализован -> выбросить ошибку.
    throw new Error("Метод execute() должен быть реализован");
  }
}

module.exports = Plugins;
