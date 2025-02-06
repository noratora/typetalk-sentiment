interface LoadMoreButtonProps {
  loadMoreMessages: () => void;
  isLoading: boolean;
}

export default function LoadMoreButton({
  loadMoreMessages,
  isLoading,
}: LoadMoreButtonProps) {
  return (
    <button
      className="btn btn-primary btn-block"
      onClick={loadMoreMessages}
      disabled={isLoading}
      aria-busy={isLoading}
      aria-live="polite"
    >
      {isLoading ? (
        <>
          <span
            className="loading loading-spinner loading-sm"
            aria-hidden="true"
          ></span>
          <span className="ml-2">読み込み中...</span>
        </>
      ) : (
        "さらに読み込む"
      )}
    </button>
  );
}
