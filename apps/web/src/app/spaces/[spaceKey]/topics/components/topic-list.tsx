import { fetchTopics } from "@/app/lib/data";
import { GetTopicsResponse, Topic } from "@/app/lib/types";
import Link from "next/link";

interface TopicListProps {
  accessToken: string;
  spaceKey: string;
}

export default async function TopicList({
  accessToken,
  spaceKey,
}: TopicListProps) {
  const response: GetTopicsResponse = await fetchTopics(accessToken, spaceKey);
  const topics: Topic[] = response.topics;

  return (
    <ul className="list-none space-y-4">
      {topics.map((topic) => (
        <li
          key={topic.id}
          className="p-4 shadow-md bg-base-200 text-base-content rounded flex justify-between items-center"
        >
          <h2 className="text-lg">{topic.name}</h2>
          <Link
            href={`/spaces/${spaceKey}/topics/${topic.id}/messages`}
            className="btn btn-sm btn-secondary"
          >
            メッセージ一覧を見る
          </Link>
        </li>
      ))}
    </ul>
  );
}
