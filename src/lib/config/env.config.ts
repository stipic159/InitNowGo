import * as dotenv from "dotenv";
import * as pack from "../../../package.json";
dotenv.config({ path: `.env.bot` });

interface BotConfig {
  readonly VERSION: string;
  readonly THUMB_IMAGE: string;
  readonly ID_DEVELOPER: number;
  readonly DEV_MODE: boolean;
  readonly SUPPORT_ID: number;
  readonly TOKEN: string;
  readonly MONGO_URI: string;
  readonly DATABASE: string;
}

interface Env {
  readonly BOT: BotConfig;
}

export class Config {
  private readonly env: Env;

  constructor() {
    this.env = this.loadEnv();
  }

  public get<T extends keyof Env>(key: T): Env[T] {
    return this.env[key];
  }

  private loadEnv(): Env {
    const requiredVars = {
      BOT: ["ID_DEVELOPER", "NODE_ENV", "SUPPORT_ID", "TOKEN", "MONGO_URI"],
    };

    for (const [section, vars] of Object.entries(requiredVars)) {
      for (const variable of vars) {
        const key = `${section}_${variable}`;
        if (!process.env[key]) {
          throw new Error(`Missing env var: ${key}`);
        }
      }
    }

    const isDev = process.env.BOT_NODE_ENV === "dev";

    return {
      BOT: {
        THUMB_IMAGE:
          process.env.BOT_THUMB_IMAGE ||
          "https://raw.githubusercontent.com/.../logo.png",
        VERSION: pack.version!,
        ID_DEVELOPER: Number(process.env.BOT_ID_DEVELOPER!),
        DEV_MODE: isDev,
        SUPPORT_ID: Number(process.env.BOT_SUPPORT_ID!),
        TOKEN: process.env.BOT_TOKEN!,
        MONGO_URI: process.env.BOT_MONGO_URI!,
        DATABASE: isDev ? "test" : "main",
      },
    };
  }
}

export const config = new Config();
