import userModel from "../models/User.js";

export const userController = {
  getUser: async (tgId) => {
    try {
      const user = await userModel.findOne({ tgId });
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  },

  updateUser: async (tgId, updateData) => {
    try {
      const user = await userModel.findOneAndUpdate({ tgId }, updateData, {
        new: true,
      });
      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },
};
