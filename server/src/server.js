import { connectDb } from "./config/db.js";
import { env, validateRuntimeConfig } from "./config/env.js";
import { createApp } from "./app.js";

async function bootstrap() {
  validateRuntimeConfig();
  await connectDb();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`AI Healthcare Assistant API running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
