import chalk from "chalk";
import fs from "fs/promises";
import path from "path";

const logDir = path.join(process.cwd(), "src/logs");
const dateFormat = new Intl.DateTimeFormat("ru-RU", {
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
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  static async write(type: string, message: string) {
    const now = new Date();
    const dateFolder = [
      String(now.getDate()).padStart(2, "0"),
      String(now.getMonth() + 1).padStart(2, "0"),
      now.getFullYear(),
    ].join(".");

    const logPath = path.join(logDir, dateFolder);
    await this.ensureDir(logPath);

    const fileName = `${type}.log`;
    const formattedDate = now.toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const logMessage = `[${formattedDate}] ${message}\n`;

    await fs.appendFile(path.join(logPath, fileName), logMessage, {
      encoding: "utf-8",
    });
  }
}

export class Logger {
  static info(message: string, ...args: any[]) {
    console.log(chalk.blue(`[INFO] ${message}`), ...args);
    FileTransport.write("info", message);
  }

  static error(message: string, ...args: any[]) {
    console.error(chalk.red(`[ERROR] ${message}`), ...args);
    FileTransport.write("error", message);
  }

  static warn(message: string) {
    console.warn(chalk.yellow(`[WARN] ${message}`));
    FileTransport.write("warn", message);
  }

  static debug(message: string) {
    console.log(chalk.magenta(`[DEBUG] ${message}`));
    FileTransport.write("debug", message);
  }

  static success(message: string) {
    console.log(chalk.green(`[SUCCESS] ${message}`));
    FileTransport.write("success", message);
  }

  static message(message: string) {
    console.log(chalk.cyan(`[MESSAGE] ${message}`));
    FileTransport.write("message", message);
  }

  static command(message: string) {
    console.log(chalk.hex("#66aa78")(`[COMMAND] ${message}`));
    FileTransport.write("command", message);
  }

  static update(message: string) {
    console.log(chalk.cyan(`[UPDATE] ${message}`));
    FileTransport.write("update", message);
  }
}
