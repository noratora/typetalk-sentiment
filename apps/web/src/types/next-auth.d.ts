import "@auth/core/jwt";
import "@auth/core/types";

declare module "@auth/core/types" {
  interface Session {
    access_token: string;
    error?: "RefreshAccessTokenError";
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    access_token: string;
    expires_at: number;
    refresh_token: string;
    error?: "RefreshAccessTokenError";
  }
}
