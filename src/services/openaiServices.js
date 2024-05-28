import OpenAI from "openai";

import { logger } from "../utils/logger.js";



const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generatePost = async (events) => {
  try {
    const messages = [
      {
        role: "system",
        content:
          "Act as a senior copywriter. You write highly engaging social media posts for LinkedIn, Facebook, and Twitter using provided thoughts/events throughout the day.",
      },
      {
        role: "user",
        content: `Write like a human, for humans. Craft three engaging social media posts tailored for LinkedIn, Facebook, and Twitter audiences. Use simple language. Use given time labels just to understand the order of the event, don't mention the time in the posts. Each post should creatively highlight the following events. Ensure the tone is conversational and impactful. Focus on engaging the respective platform's audience, encouraging interaction, and driving interest in the events: ${events
          .map((event) => event.text)
          .join(", ")}`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
    });

    return response;
  } catch (error) {
    logger.error("Error generating post:", error);
    throw error;
  }
};

export default { generatePost };
