import "dotenv/config";
import { resetStore } from "../store/json-store.js";

resetStore();
console.log("Seeded demo data written to data/db.json");
