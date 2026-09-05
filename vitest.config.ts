import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    env: {
      DATA_PATH: "./data/test-db.json",
    },
  },
});
