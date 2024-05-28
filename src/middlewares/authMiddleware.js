export const authMiddleware = (ctx, next) => {
  if (!ctx.from) {
    ctx.reply("Authentication required.");
    return;
  }
  next();
};
