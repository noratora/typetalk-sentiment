import MenuIcon from "@/app/components/icons/menu-icon";
import { logIn } from "@/app/lib/actions";

export default function LoginButton() {
  return (
    <>
      {/* 画面幅が広い端末ではボタンを表示する */}
      <div className="hidden md:block">
        <form action={logIn}>
          <button type="submit" className="btn btn-primary">
            Typetalkで始める
          </button>
        </form>
      </div>
      {/* 画面幅が狭い端末ではメニューを表示する */}
      <div className="block md:hidden dropdown dropdown-end">
        <button
          tabIndex={0}
          className="btn btn-ghost btn-circle"
          aria-label="ログインメニューを開く"
          aria-haspopup="menu"
        >
          <MenuIcon />
        </button>
        <ul
          tabIndex={0}
          className="menu dropdown-content z-[1] p-2 shadow bg-base-200 rounded-box w-52 mt-4"
          aria-label="ログインメニュー"
        >
          <li>
            <form action={logIn} className="p-0 w-48 h-9">
              <button type="submit" className="text-left w-48 h-9 px-4 py-2">
                Typetalkで始める
              </button>
            </form>
          </li>
        </ul>
      </div>
    </>
  );
}
