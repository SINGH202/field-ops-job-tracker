import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

app.listen(config.port, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${config.port}`);
});
