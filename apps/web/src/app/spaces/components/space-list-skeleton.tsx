export default function SpaceListSkeleton() {
  return (
    <ul className="list-none space-y-4">
      {[...Array(5)].map((_, i) => (
        <li
          key={i}
          className="p-4 shadow-md bg-base-200 text-base-content rounded flex justify-between items-center"
        >
          <div className="flex items-center gap-4">
            {/* 組織の画像 */}
            <div className="skeleton rounded-full w-10 h-10"></div>
            {/* 組織名 */}
            <div className="skeleton rounded w-32 h-7"></div>
          </div>
          {/* トピック一覧を見る */}
          <div className="skeleton rounded w-36 h-8"></div>
        </li>
      ))}
    </ul>
  );
}
