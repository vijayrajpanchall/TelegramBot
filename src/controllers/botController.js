import userModel from "../models/User.js";
import eventModel from "../models/Event.js";
// import openaiService from "../services/openaiService.js";
import openaiServices from "../services/openaiServices.js";

export const botController = {
  start: async (ctx) => {
    const from = ctx.update.message.from;

    try {
      await userModel.findOneAndUpdate(
        { tgId: from.id },
        {
          $setOnInsert: {
            firstName: from.first_name,
            lastName: from.last_name,
            isBot: from.is_bot,
            username: from.username,
          },
        },
        { upsert: true, new: true }
      );
      await ctx.reply(
        `Hey! ${from.first_name}, Welcome. I will be writing highly engaging social media posts for you. Just keep feeding me with the events throughout the day. Let's shine on social media!`
      );
    } catch (error) {
      console.error(error);
      await ctx.reply("Facing difficulties");
    }
  },

  generate: async (ctx) => {
    const from = ctx.update.message.from;

    const { message_id: waitingMessageId } = await ctx.reply(
      `Hey! ${from.first_name} kindly wait for a moment. I am curating posts for you...`
    );

    const { message_id: loadingStickerMsgId } = await ctx.replyWithSticker(
      "CAACAgIAAxkBAAMsZlVtgQ57IsCw_HeJI-4PnP06WHwAAlUAA6_GURpk5_zwJekQvzUE"
    );

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfTheDay = new Date();
    endOfTheDay.setHours(23, 59, 59, 999);

    const events = await eventModel.find({
      tgId: from.id,
      createdAt: { $gte: startOfDay, $lte: endOfTheDay },
    });

    if (events.length === 0) {
      await ctx.deleteMessage(waitingMessageId);
      await ctx.deleteMessage(loadingStickerMsgId);
      await ctx.reply("No events for the day");
      return;
    }

    try {
      const chatCompletion = await openaiServices.generatePost(events);
      await userModel.findOneAndUpdate(
        { tgId: from.id },
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
      console.error(error);
      await ctx.reply("Facing difficulties");
    }
  },

  handleText: async (ctx) => {
    const from = ctx.update.message.from;
    const message = ctx.update.message.text;

    try {
      await eventModel.create({ text: message, tgId: from.id });
      await ctx.reply(
        "Noted. Keep texting me your thoughts. To generate the posts, just enter the command: /generate"
      );
    } catch (error) {
      console.error(error);
      await ctx.reply("Facing difficulties, please try again later");
    }
  },
};
