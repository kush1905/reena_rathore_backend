import "dotenv/config";
import { createApp } from "./app.js";
import { loadStore } from "./store/json-store.js";

loadStore();

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`Reena Rathore API listening on port ${port}`);
});
