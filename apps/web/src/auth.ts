import { authConfig } from "@/auth.config";
import { UserinfoEndpointHandler } from "@auth/core/providers";
import NextAuth from "next-auth";
import { OAuth2Config } from "next-auth/providers";

interface TypetalkProfile {
  id: string;
  name?: string | null;
  fullName?: string | null;
  mailAddress?: string | null;
  imageUrl?: string | null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Typetalk 認証
    {
      id: "typetalk",
      name: "Typetalk",
      issuer: "https://typetalk.com/",
      type: "oauth",
      authorization: {
        url: "https://typetalk.com/oauth2/authorize",
        params: { scope: "topic.read my" },
      },
      token: "https://typetalk.com/oauth2/access_token",
      userinfo: {
        url: "https://typetalk.com/api/v1/profile",
        async request({ tokens, provider }: UserinfoEndpointHandler) {
          const profile = await fetch(provider.userinfo?.url as URL, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "User-Agent": "authjs",
            },
          }).then(async (res) => await res.json());

          return profile.account;
        },
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name ?? profile.fullName,
          email: profile.mailAddress,
          image: profile.imageUrl,
        };
      },
    } satisfies OAuth2Config<TypetalkProfile>,
  ],
});
