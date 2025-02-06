import { logOut } from "@/app/lib/actions";
import { Session } from "next-auth";
import Image from "next/image";

export default function UserMenu({ user }: { user: Session["user"] }) {
  return (
    <div className="dropdown dropdown-end">
      <div
        role="button"
        tabIndex={0}
        className="btn btn-ghost btn-circle avatar"
        aria-label="ユーザーメニューを開く"
        aria-haspopup="menu"
      >
        <div className="w-10 rounded-full">
          <Image
            src={user?.image ?? ""}
            alt={`${user?.name || "ユーザー"}のプロフィール画像`}
            width={40}
            height={40}
          />
        </div>
      </div>
      <ul
        tabIndex={0}
        className="menu dropdown-content z-[1] p-2 shadow bg-base-200 rounded-box w-52 mt-4"
        aria-label="ユーザーメニュー"
      >
        <li>
          <form action={logOut} className="p-0 w-48 h-9">
            <button type="submit" className="text-left w-48 h-9 px-4 py-2">
              ログアウト
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}
