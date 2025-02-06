import { Post } from "@/app/lib/types";
import MessageItem from "@/app/spaces/[spaceKey]/topics/[topicId]/messages/components/message-item";

interface MessageListPresentationProps {
  posts: Post[];
  topicId: number;
}

export default function MessageListPresentation({
  posts,
  topicId,
}: MessageListPresentationProps) {
  return (
    <>
      {posts.length === 0 ? (
        <p className="text-center text-neutral">メッセージがありません。</p>
      ) : (
        <ul
          className="list-none space-y-4"
          aria-live="polite"
          aria-atomic="false"
        >
          {posts.map((post) => (
            <li key={post.id}>
              <MessageItem post={post} topicId={topicId} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
