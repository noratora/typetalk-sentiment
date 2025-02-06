import Breadcrumb from "@/app/components/layout/breadcrumb";
import PrimaryHeading from "@/app/components/layout/primary-heading";
import { PAGE_TITLES } from "@/app/lib/constants";
import MessageListContainer from "@/app/spaces/[spaceKey]/topics/[topicId]/messages/components/message-list-container";
import MessageListSkeleton from "@/app/spaces/[spaceKey]/topics/[topicId]/messages/components/message-list-skeleton";
import { auth } from "@/auth";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

export const metadata: Metadata = {
  title: PAGE_TITLES.MESSAGE_LIST,
};

const paramsSchema = z.object({
  spaceKey: z.string().min(1),
  topicId: z.number().int(),
});

export default async function Page(props: {
  params: Promise<{ spaceKey: string; topicId: string }>;
}) {
  const params = await props.params;
  // 認証情報を取得する
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const accessToken = session.access_token;

  // パラメータのバリデーション
  const parsedParams = paramsSchema.safeParse({
    spaceKey: params.spaceKey,
    topicId: Number(params.topicId),
  });
  if (!parsedParams.success) {
    notFound();
  }
  const { spaceKey, topicId } = parsedParams.data;

  const breadcrumbItems = [
    { label: PAGE_TITLES.SPACE_LIST, href: "/spaces" },
    {
      label: PAGE_TITLES.TOPIC_LIST,
      href: `/spaces/${spaceKey}/topics`,
    },
    { label: PAGE_TITLES.MESSAGE_LIST, isCurrent: true },
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      <main className="space-y-4">
        <PrimaryHeading title={PAGE_TITLES.MESSAGE_LIST} />
        <Suspense fallback={<MessageListSkeleton />}>
          <MessageListContainer accessToken={accessToken} topicId={topicId} />
        </Suspense>
      </main>
    </>
  );
}
