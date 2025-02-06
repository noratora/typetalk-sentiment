import Breadcrumb from "@/app/components/layout/breadcrumb";
import PrimaryHeading from "@/app/components/layout/primary-heading";
import { PAGE_TITLES } from "@/app/lib/constants";
import SpaceList from "@/app/spaces/components/space-list";
import SpaceListSkeleton from "@/app/spaces/components/space-list-skeleton";
import { auth } from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: PAGE_TITLES.SPACE_LIST,
};

export default async function Page() {
  // 認証情報を取得する
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const accessToken = session.access_token;
  const breadcrumbItems = [{ label: PAGE_TITLES.SPACE_LIST, isCurrent: true }];

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      <main>
        <PrimaryHeading title={PAGE_TITLES.SPACE_LIST} />
        <Suspense fallback={<SpaceListSkeleton />}>
          <SpaceList accessToken={accessToken} />
        </Suspense>
      </main>
    </>
  );
}
