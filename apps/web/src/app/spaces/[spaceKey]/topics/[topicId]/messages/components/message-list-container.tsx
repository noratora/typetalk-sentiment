import { fetchMessages } from "@/app/lib/data";
import { GetMessagesResponse } from "@/app/lib/types";
import MessageListClientContainer from "@/app/spaces/[spaceKey]/topics/[topicId]/messages/components/message-list-client-container";

interface MessageListContainerProps {
  accessToken: string;
  topicId: number;
}

export default async function MessageListContainer({
  accessToken,
  topicId,
}: MessageListContainerProps) {
  const initialMessages: GetMessagesResponse = await fetchMessages(
    accessToken,
    topicId
  );

  return <MessageListClientContainer initialMessages={initialMessages} />;
}
