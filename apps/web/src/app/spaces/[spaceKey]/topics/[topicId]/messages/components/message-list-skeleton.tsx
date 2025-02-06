export default function MessageListSkeleton() {
  return (
    <ul className="list-none space-y-4">
      {[...Array(3)].map((_, index) => (
        <li
          key={index}
          className="p-4 shadow-md bg-base-200 text-base-content rounded"
        >
          <div className="flex items-center gap-4 mb-2">
            {/* アカウントのアイコン */}
            <div className="skeleton rounded-full w-10 h-10"></div>
            <div>
              {/* アカウント名 */}
              <div className="skeleton w-28 h-7 mb-1"></div>
              {/* 投稿日時 */}
              <div className="skeleton w-32 h-5"></div>
            </div>
          </div>
          {/* メッセージ本文 */}
          <div className="break-words mb-4">
            <div className="skeleton w-full h-6 mb-2"></div>
            <div className="skeleton w-full h-6 mb-2"></div>
            <div className="skeleton w-3/4 h-6"></div>
          </div>
          <div className="flex justify-between items-center">
            {/* 感情バッジ */}
            <div className="skeleton w-28 h-6"></div>
            {/* Typetalkで見る */}
            <div className="skeleton w-32 h-8"></div>
          </div>
        </li>
      ))}
    </ul>
  );
}
