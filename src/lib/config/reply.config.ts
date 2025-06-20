export const reply = {
  ru: {
    system: {
      error: `⚠️ Упс, что-то пошло не так...\nПопробуй повторить действие через пару минут.`,
      welcome: "👋 Добро пожаловать!",
      creatorAccessDenied: "⛔ Эта функция доступна только создателю.",
      errorSending: "⚠️ Ошибка при отправке. Попробуйте еще раз.",
    },
    oftUsed: {},
    command: {},
    BotUpdates: {
      creatorAccessDeniedCallback:
        "🚨 Недостаточно прав! Только создатель может использовать эту команду",
      creatorCommandRestricted: "🚷 Команда доступна только создателю",
      callbackQueryError: "Ошибка запроса",
      callbackExecutionError: "⚠️ Ошибка выполнения",
      moduleRegistrationError: "Ошибка регистрации модуля",
      eventHandlerError: "Ошибка обработчика событий",
      moduleLoadError: "Ошибка при загрузке модуля",
      directoryReadError: "Ошибка при чтении директории",
      callbackProcessingError: "Ошибка обработки callback",
      botRunError: "Ошибка в BotUpdates.run",
      invalidCallbackWarning: "Получен некорректный callback-запрос",
      missingClassWarning: "Файл не содержит класс-наследник BotUpdate",
      patternRequiredError: "✖️ Обязательное свойство 'pattern' отсутствует",
      callbackConfirmationError: "⚠️ Ошибка подтверждения callback-запроса",
      executeNotImplemented: "❌ Метод execute не реализован в классе",
    },
    moduleLogs: {
      commandModule: (name: string, pattern: string) =>
        `📌 Командный модуль: ${name} | Паттерны: ${pattern}`,

      globalHandler: (name: string) =>
        `🌐 Глобальный обработчик: ${name} (файл: ${name.toLowerCase()}.event.ts)`,

      eventLoaded: (name: string, file: string) =>
        `✅ Загружен EVENT-обработчик: ${name} (${file})`,

      commandLoaded: (name: string, file: string) =>
        `✅ Загружен командный модуль: ${name} (${file})`,
    },
    stylizeText: (text: string) => {
      const stylizedChars: Record<string, string> = {
        a: "ᴀ",
        b: "ʙ",
        c: "ᴄ",
        d: "ᴅ",
        e: "ᴇ",
        f: "ꜰ",
        g: "ɢ",
        h: "ʜ",
        i: "ɪ",
        j: "ᴊ",
        k: "ᴋ",
        l: "ʟ",
        m: "ᴍ",
        n: "ɴ",
        o: "ᴏ",
        p: "ᴘ",
        q: "ǫ",
        r: "ʀ",
        s: "s",
        t: "ᴛ",
        u: "ᴜ",
        v: "ᴠ",
        w: "ᴡ",
        x: "x",
        y: "ʏ",
        z: "ᴢ",
      };

      return text
        .toLowerCase()
        .split("")
        .map((char) => stylizedChars[char] || char)
        .join("");
    },
  },
};
