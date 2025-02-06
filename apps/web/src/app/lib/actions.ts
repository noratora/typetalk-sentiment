"use server";

import { signIn, signOut } from "@/auth";

export async function logIn() {
  await signIn("typetalk");
}

export async function logOut() {
  await signOut({ redirectTo: "/" });
}
