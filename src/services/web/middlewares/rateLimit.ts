import rateLimit from "express-rate-limit";
import { logger } from "../../..";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many requests, please try again later.",
  keyGenerator: (req) => req.ip || "unknown",
  handler: (req, res, next) => {
    logger.warn("Steam auth rate limit hit", {
      ip: req.ip,
      route: req.originalUrl,
    });

    res
      .status(429)
      .send("Too many Steam auth attempts. Please wait a bit and try again.");
  },
});

export default limiter;
