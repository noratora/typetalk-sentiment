import { useToast } from "@/app/contexts/toast-provider";
import { ERROR_MESSAGES } from "@/app/lib/constants";
import { HttpResponseError } from "@/app/lib/errors";
import { ErrorResponse, GetMessagesResponse, Post } from "@/app/lib/types";
import { buildUrl } from "@/app/lib/url-utils";
import { useCallback, useState } from "react";

/**
 * useMessagesフックの戻り値の型
 */
interface UseMessagesReturn {
  posts: Post[];
  hasNext: boolean;
  loadMoreMessages: () => Promise<void>;
  isLoading: boolean;
}

/**
 * メッセージの状態管理と追加読み込み機能を提供するフック
 * @param initialMessages 初期メッセージデータ
 * @returns UseMessagesReturn
 */
export function useMessages(
  initialMessages: GetMessagesResponse
): UseMessagesReturn {
  const topicId = initialMessages.topic.id;
  const [posts, setPosts] = useState<Post[]>(initialMessages.posts);
  const [hasNext, setHasNext] = useState<boolean>(initialMessages.hasNext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showToast } = useToast();

  /**
   * 追加のメッセージを読み込む
   */
  const loadMoreMessages = useCallback(async (): Promise<void> => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const method = "GET";
      const endpoint = `/api/topics/${topicId}/messages`;
      const fromId = posts[posts.length - 1]?.id;
      const url = buildUrl(endpoint, { from: fromId });

      const response = await fetch(url, { method });
      if (!response.ok) {
        const errorResponse = (await response.json()) as ErrorResponse;
        throw new HttpResponseError(
          errorResponse.title,
          url,
          method,
          response.status
        );
      }

      const additionalMessages = (await response.json()) as GetMessagesResponse;
      setPosts((prevPosts) => {
        // 重複を除去する
        const newPosts = additionalMessages.posts.filter(
          (newPost) => !prevPosts.some((prevPost) => prevPost.id === newPost.id)
        );
        return [...prevPosts, ...newPosts];
      });
      setHasNext(additionalMessages.hasNext);
    } catch (error) {
      const displayMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNEXPECTED;

      console.error({
        context: "useMessages",
        error: error instanceof Error ? error.message : error,
        displayMessage,
      });

      showToast(displayMessage, "error");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, topicId, posts, showToast]);

  return { posts, hasNext, loadMoreMessages, isLoading };
}
