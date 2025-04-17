import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";

const logDir = "logs";

const { combine, timestamp, printf, errors, colorize, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      errors({ stack: true }),
      logFormat
    ),
  }),
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, "application-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    level: "info",
    format: combine(timestamp(), errors({ stack: true }), json()),
  }),
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, "errors-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    level: "error",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
    format: combine(timestamp(), errors({ stack: true }), json()),
  }),
];

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: combine(errors({ stack: true })),
  transports,
  exitOnError: false,
});

export default logger;
