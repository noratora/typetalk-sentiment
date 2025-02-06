export default function TopicListSkeleton() {
  return (
    <ul className="list-none space-y-4">
      {[...Array(5)].map((_, i) => (
        <li
          key={i}
          className="p-4 shadow-md bg-base-200 text-base-content rounded flex justify-between items-center"
        >
          {/* トピック名 */}
          <div className="skeleton rounded w-1/3 h-7"></div>
          {/* メッセージ一覧を見る */}
          <div className="skeleton rounded w-40 h-8"></div>
        </li>
      ))}
    </ul>
  );
}
