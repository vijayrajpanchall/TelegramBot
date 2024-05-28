import { Telegraf } from "telegraf";
import connectDb from "./src/config/db.js";
import { botController } from "./src/controllers/botController.js";
import { logger } from "./src/utils/logger.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

connectDb().catch((error) => {
  logger.error("Database connection failed:", error);
  process.kill(process.pid, "SIGTERM");
});

bot.start(botController.start);
bot.command("generate", botController.generate);
bot.on("text", botController.handleText);

bot
  .launch()
  .then(() => logger.info("Bot launched successfully"))
  .catch((error) => logger.error("Bot launch error:", error));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
