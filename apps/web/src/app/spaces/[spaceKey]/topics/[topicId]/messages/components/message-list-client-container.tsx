"use client";

import { GetMessagesResponse } from "@/app/lib/types";
import LoadMoreButton from "@/app/spaces/[spaceKey]/topics/[topicId]/messages/components/load-more-button";
import MessageListPresentation from "@/app/spaces/[spaceKey]/topics/[topicId]/messages/components/message-list-presentation";
import { useMessages } from "@/app/spaces/[spaceKey]/topics/[topicId]/messages/hooks/useMessages";

interface MessageListClientContainerProps {
  initialMessages: GetMessagesResponse;
}

export default function MessageListClientContainer({
  initialMessages,
}: MessageListClientContainerProps) {
  const { posts, hasNext, loadMoreMessages, isLoading } =
    useMessages(initialMessages);

  return (
    <>
      <MessageListPresentation
        posts={posts}
        topicId={initialMessages.topic.id}
      />
      {hasNext && (
        <LoadMoreButton
          loadMoreMessages={loadMoreMessages}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
