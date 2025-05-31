// @ts-check
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";
import auth from "auth-astro";

// https://astro.build/config
export default defineConfig({
  output: "static",
  adapter: cloudflare(),

  experimental: {
    session: true,
  },

  integrations: [auth()],
});
