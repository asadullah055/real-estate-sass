import { connectDB } from "./infra/database/connection.js";
import { initAuth } from "./config/auth.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

async function bootstrap() {
  // 1. Connect to MongoDB (Better Auth needs the native Db instance)
  await connectDB();

  // 2. Initialise Better Auth (mongodbAdapter requires a connected Db)
  const auth = initAuth();

  // 3. Create and start Express
  const app = createApp(auth);

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Better Auth base URL: ${env.BETTER_AUTH_URL}/api/auth`);
  });
}

bootstrap().catch((err) => {
  logger.error("Server failed to start", err);
  process.exit(1);
});
