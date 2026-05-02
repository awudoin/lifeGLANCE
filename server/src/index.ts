import { createApp } from "./app.js";
import { config } from "./config.js";
import "./db/client.js";

const app = createApp();

app.listen(config.port, () => {
  console.log(`lifeGLANCE API listening on http://localhost:${config.port}`);
});
