import { env } from "@/env/server";
import { type TokenSet } from "@auth/core/types";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const pathname = nextUrl.pathname;
      const isLoggedIn = !!auth?.user;

      if (pathname === "/" && isLoggedIn) {
        return Response.redirect(new URL("/spaces", nextUrl));
      }

      if (pathname.startsWith("/spaces")) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      return true;
    },

    // https://authjs.dev/guides/basics/callbacks#session-callback
    async session({ session, user, token }) {
      // Send properties to the client, like an access_token from a provider.
      session.access_token = token.access_token;
      session.error = token.error;
      return session;
    },

    // https://authjs.dev/guides/basics/callbacks#jwt-callback
    // https://authjs.dev/guides/basics/refresh-token-rotation
    async jwt({ token, user, account, profile, isNewUser }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        if (!account.access_token)
          throw new Error("account.access_token error");
        if (!account.expires_at) throw new Error("account.expires_at error");
        if (!account.refresh_token)
          throw new Error("account.refresh_token error");

        // Save the access token and refresh token in the JWT on the initial login
        token.access_token = account.access_token;
        token.expires_at = account.expires_at;
        token.refresh_token = account.refresh_token;
        return token;
      } else if (token.expires_at && Date.now() < token.expires_at * 1000) {
        // If the access token has not expired yet, return it
        return token;
      } else {
        // If the access token has expired, try to refresh it
        try {
          const response = await fetch(
            "https://typetalk.com/oauth2/access_token",
            {
              body: new URLSearchParams({
                client_id: env.AUTH_TYPETALK_ID,
                client_secret: env.AUTH_TYPETALK_SECRET,
                grant_type: "refresh_token",
                refresh_token: token.refresh_token,
              }),
              method: "POST",
            }
          );

          const tokens: TokenSet = await response.json();

          if (!response.ok) throw new Error("tokens error");
          if (!tokens.access_token)
            throw new Error("tokens.access_token error");
          if (!tokens.expires_in) throw new Error("tokens.expires_in error");

          token.access_token = tokens.access_token as string;
          token.expires_at = Math.floor(Date.now() / 1000 + tokens.expires_in);
          // Fall back to old refresh token, but note that
          // many providers may only allow using a refresh token once.
          token.refresh_token = tokens.refresh_token ?? token.refresh_token;

          delete token.error;
          return token;
        } catch (error) {
          console.error("Error refreshing access token", error);
          // The error property will be used client-side to handle the refresh token error
          return { ...token, error: "RefreshAccessTokenError" as const };
        }
      }
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
