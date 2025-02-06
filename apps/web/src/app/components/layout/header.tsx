import LoginButton from "@/app/components/elements/login-button";
import ThemeSwitcher from "@/app/components/elements/theme-switcher";
import UserMenu from "@/app/components/elements/user-menu";
import { auth } from "@/auth";

export default async function Header() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const user = session?.user;

  return (
    <header className="navbar bg-base-300 h-16 gap-2 px-4">
      <div className="flex-1">
        <span className="text-xl">Typetalk Sentiment</span>
      </div>
      <nav className="flex justify-end flex-1">
        <ThemeSwitcher />
        {isLoggedIn ? (
          <UserMenu user={user} />
        ) : (
          <>
            <LoginButton />
          </>
        )}
      </nav>
    </header>
  );
}
