import { formatDate } from "@/app/lib/date-utils";
import { Post } from "@/app/lib/types";
import SentimentBadge from "@/app/spaces/[spaceKey]/topics/[topicId]/messages/components/sentiment-badge";
import Image from "next/image";
import Link from "next/link";

interface MessageItemProps {
  post: Post;
  topicId: number;
}

export default function MessageItem({ post, topicId }: MessageItemProps) {
  return (
    <article className="p-4 shadow-md bg-base-200 text-base-content rounded">
      <div className="flex items-center gap-4 mb-2">
        <Image
          src={post.account.imageUrl}
          alt={`${post.account.name}のプロフィール画像`}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <h2 className="text-lg">{post.account.name}</h2>
          <time dateTime={post.updatedAt} className="text-sm">
            {formatDate(post.updatedAt)}
          </time>
        </div>
      </div>
      <p className="break-words mb-4">{post.message}</p>
      <div className="flex items-center gap-4">
        <div className="mr-auto">
          <SentimentBadge sentiment={post.sentiment} />
        </div>
        <Link
          href={`https://typetalk.com/topics/${topicId}/posts/${post.id}`}
          className="btn btn-sm btn-secondary"
          target="_blank"
          rel="noopener noreferrer"
        >
          Typetalkで見る
        </Link>
      </div>
    </article>
  );
}
