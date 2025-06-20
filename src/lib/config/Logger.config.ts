import chalk from "chalk";
import fs from "fs/promises";
import path from "path";

const logDir = path.join(process.cwd(), "logs");
const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

class FileTransport {
  private static async ensureDir(dirPath: string) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== "EEXIST") throw error;
    }
  }

  static async write(type: string, message: string) {
    const now = new Date();
    const dateFolder = [
      now.getDate().toString().padStart(2, "0"),
      (now.getMonth() + 1).toString().padStart(2, "0"),
      now.getFullYear(),
    ].join(".");

    const logPath = path.join(logDir, dateFolder);
    await this.ensureDir(logPath);

    const fileName = `${type}.log`;
    const formattedDate = dateFormatter.format(now);
    const logMessage = `[${formattedDate}] ${message}\n`;

    await fs.appendFile(path.join(logPath, fileName), logMessage, "utf8");
  }
}

type LogLevel =
  | "info"
  | "error"
  | "warn"
  | "debug"
  | "success"
  | "message"
  | "command"
  | "update";

export class Logger {
  private static log(
    level: LogLevel,
    color: (s: string) => string,
    message: string,
    ...args: unknown[]
  ) {
    const prefix = `[${level.toUpperCase()}]`;
    console.log(color(`${prefix} ${message}`), ...args);
    FileTransport.write(level, message);
  }

  static info(message: string, ...args: unknown[]) {
    this.log("info", chalk.blue, message, ...args);
  }

  static error(message: string, ...args: unknown[]) {
    this.log("error", chalk.red, message, ...args);
  }

  static warn(message: string, ...args: unknown[]) {
    this.log("warn", chalk.yellow, message, ...args);
  }

  static debug(message: string, ...args: unknown[]) {
    this.log("debug", chalk.magenta, message, ...args);
  }

  static success(message: string, ...args: unknown[]) {
    this.log("success", chalk.green, message, ...args);
  }

  static message(message: string, ...args: unknown[]) {
    this.log("message", chalk.cyan, message, ...args);
  }

  static command(message: string, ...args: unknown[]) {
    this.log("command", chalk.hex("#66aa78"), message, ...args);
  }

  static update(message: string, ...args: unknown[]) {
    this.log("update", chalk.cyan, message, ...args);
  }
}
