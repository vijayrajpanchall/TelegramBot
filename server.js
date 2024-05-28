import { Telegraf } from "telegraf";
import userModel from "./src/models/User.js";
import eventModel from "./src/models/Event.js";
import connectDb from "./src/config/db.js";
import { message } from "telegraf/filters";
import OpenAI from "openai";

const bot = new Telegraf(process.env.BOT_TOKEN);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

try {
  connectDb();
  console.log("Database connected successfully");
} catch (error) {
  console.log(error);
  process.kill(process.pid, "SIGTERM");
}

bot.start(async (ctx) => {
  console.log("context", ctx);

  const from = ctx.update.message.from;

  try {
    await userModel.findOneAndUpdate(
      { tgId: from.id },
      {
        $setOnInsert: {
          firstName: from.first_name,
          lastname: from.last_name,
          isBot: from.is_bot,
          username: from.username,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
    await ctx.reply(
      `Hey! ${from.first_name}, Welcome. I will be writing highly engaging social media posts for you Just keep feeding me with the events throught the day. Let's shine on social media`
    );
  } catch (error) {
    console.log(error);
    await ctx.reply("Facing difficulties");
  }
  //store the user information into db

  // console.log("bot working")
});

bot.command("generate", async (ctx) => {
  const from = ctx.update.message.from;

  const { message_id: waitingMessageId } = await ctx.reply(
    `Hey! ${from.first_name} kindly wait for a moment. I am curting posts for you...`
  );

  const { message_id: loadingStickerMsgId } = await ctx.replyWithSticker(
    "CAACAgIAAxkBAAMsZlVtgQ57IsCw_HeJI-4PnP06WHwAAlUAA6_GURpk5_zwJekQvzUE"
  );

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfTheDay = new Date();
  endOfTheDay.setHours(23, 59, 59, 999);
  //get events for the user

  const events = await eventModel.find({
    tgId: from.id,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfTheDay,
    },
  });

  if (events.length === 0) {
    await ctx.deleteMessage(waitingMessageId);
    await ctx.deleteMessage(loadingStickerMsgId);
    await ctx.reply("No events for the dat");
    return;
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Act as a senior copywriter, you write highly engaging social media posts for linkedin, facebook and twitter using provided thoughts/events throught the day",
        },
        {
          role: "user",
          content: `Write like a human, for humans. Craft three engaging social media posts tailored for LinkedIn, Facebook, and Twitter audiences. Use simple language. Use given time labels just to understand the order of the event, don't mention the time in the posts. Each post should creatively highlight the following events. Ensure the tone is conversational and impactful. Focus on
                    engaging the respective platform's audience, encouraging interaction, and driving interest in the events: 
                    ${events.map((event) => event.text).join(", ")}`,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    await userModel.findOneAndUpdate(
      {
        tgId: from.id,
      },
      {
        $inc: {
          promptTokens: chatCompletion.usage.prompt_tokens,
          completionTokens: chatCompletion.usage.completion_tokens,
        },
      }
    );

    await ctx.deleteMessage(waitingMessageId);
    await ctx.deleteMessage(loadingStickerMsgId);

    await ctx.reply(chatCompletion.choices[0].message.content);
  } catch (error) {
    await ctx.reply("Facing difficulties");
  }

  //store token count
  //send response.
});

//to get sticker ID only
// bot.on(message('sticker'), (ctx) => {
//   console.log("sticker", ctx.update.message);
// });

bot.on(message("text"), async (ctx) => {
  const from = ctx.update.message.from;

  const message = ctx.update.message.text;

  try {
    await eventModel.create({ text: message, tgId: from.id });
    await ctx.reply(
      "Noted Keep texting me your thoughts. To generate the posts, just enter the command: /generate"
    );
  } catch (error) {
    console.log(error);
    await ctx.reply("Facing difficulties, please try again later");
  }
});

bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
