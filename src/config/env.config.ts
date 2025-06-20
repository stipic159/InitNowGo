import * as dotenv from "dotenv";
dotenv.config({ path: `.env.bot` });

interface BotConfig {
  readonly THUMB_IMAGE: string;
  readonly VERSION: string;
  readonly ID_DEVELOPER: number;
  readonly DEV_MODE: boolean;
  readonly SUPPORT_ID: number;
  readonly TOKEN: string;
  readonly MONGO_URI: string;
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
      BOT: [
        "VERSION",
        "ID_DEVELOPER",
        "NODE_ENV",
        "SUPPORT_ID",
        "TOKEN",
        "MONGO_URI",
      ],
    };

    for (const [section, vars] of Object.entries(requiredVars)) {
      for (const variable of vars) {
        const key = `${section}_${variable}` as keyof NodeJS.ProcessEnv;
        if (!process.env[key]) {
          throw new Error(`Missing env var: ${section}.${variable} (${key})`);
        }
      }
    }

    return {
      BOT: {
        THUMB_IMAGE:
          process.env.BOT_THUMB_IMAGE ||
          "https://raw.githubusercontent.com/SecktorBot/Brandimages/main/logos/SocialLogo%201.png", // todo
        VERSION: process.env.BOT_VERSION!,
        ID_DEVELOPER: Number(process.env.BOT_ID_DEVELOPER!)!,
        DEV_MODE: process.env.BOT_NODE_ENV! === "development",
        SUPPORT_ID: Number(process.env.BOT_SUPPORT_ID!)!,
        TOKEN: process.env.BOT_TOKEN!,
        MONGO_URI: process.env.BOT_MONGO_URI!,
      },
    };
  }
}

export const config = new Config();
