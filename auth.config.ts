import GitHub from "@auth/core/providers/github";
import { defineConfig } from "auth-astro";
import { db } from "./src/db";
import * as userService from "./src/lib/user-service";

export default defineConfig({
  providers: [
    GitHub({
      clientId: import.meta.env.GITHUB_CLIENT_ID,
      clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (trigger === "signIn" && user?.email) {
        // Find or create user in your DB
        console.log("[jwt] New user sign in, finding or creating user");
        await userService.findOrCreateUser(db, user.email, user.name || "");
      }
      return token;
    },
  },
});
