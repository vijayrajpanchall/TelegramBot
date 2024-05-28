import eventModel from "../models/Event.js";
import { logger } from "../utils/logger.js";

const createEvent = async (eventData) => {
  try {
    const event = await eventModel.create(eventData);
    return event;
  } catch (error) {
    logger.error("Error creating event:", error);
    throw error;
  }
};

const getEventsForUser = async (tgId, startOfDay, endOfTheDay) => {
  try {
    const events = await eventModel.find({
      tgId,
      createdAt: { $gte: startOfDay, $lte: endOfTheDay },
    });
    return events;
  } catch (error) {
    logger.error("Error fetching events:", error);
    throw error;
  }
};

export default { createEvent, getEventsForUser };
