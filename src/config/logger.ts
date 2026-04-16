import winston from "winston";

const { combine, timestamp, errors, json, prettyPrint } = winston.format;

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp(),
    errors({ stack: true }),
    process.env.NODE_ENV === "production" ? json() : prettyPrint()
  ),
  transports: [new winston.transports.Console()],
});
