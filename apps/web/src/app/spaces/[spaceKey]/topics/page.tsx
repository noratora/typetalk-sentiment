import Breadcrumb from "@/app/components/layout/breadcrumb";
import PrimaryHeading from "@/app/components/layout/primary-heading";
import { PAGE_TITLES } from "@/app/lib/constants";
import TopicList from "@/app/spaces/[spaceKey]/topics/components/topic-list";
import TopicListSkeleton from "@/app/spaces/[spaceKey]/topics/components/topic-list-skeleton";
import { auth } from "@/auth";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

export const metadata: Metadata = {
  title: PAGE_TITLES.TOPIC_LIST,
};

const paramsSchema = z.object({
  spaceKey: z.string().min(1),
});

export default async function Page(props: {
  params: Promise<{ spaceKey: string }>;
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
  });
  if (!parsedParams.success) {
    notFound();
  }
  const { spaceKey } = parsedParams.data;

  const breadcrumbItems = [
    { label: PAGE_TITLES.SPACE_LIST, href: "/spaces" },
    {
      label: PAGE_TITLES.TOPIC_LIST,
      isCurrent: true,
    },
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      <main>
        <PrimaryHeading title={PAGE_TITLES.TOPIC_LIST} />
        <Suspense fallback={<TopicListSkeleton />}>
          <TopicList accessToken={accessToken} spaceKey={spaceKey} />
        </Suspense>
      </main>
    </>
  );
}
