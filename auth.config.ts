import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { defineConfig } from "auth-astro";
import { db } from "@/db";
import * as userService from "@/lib/services/user-service";

export default defineConfig({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
