import { fetchSpaces } from "@/app/lib/data";
import { GetSpacesResponse, Space } from "@/app/lib/types";
import Image from "next/image";
import Link from "next/link";

interface SpaceListProps {
  accessToken: string;
}

export default async function SpaceList({ accessToken }: SpaceListProps) {
  const response: GetSpacesResponse = await fetchSpaces(accessToken);
  const spaces: Space[] = response.spaces;

  return (
    <ul className="list-none space-y-4">
      {spaces.map((space) => (
        <li
          key={space.key}
          className="p-4 shadow-md bg-base-200 text-base-content rounded flex justify-between items-center"
        >
          <div className="flex items-center gap-4">
            <Image
              src={space.imageUrl}
              alt={`${space.name}の組織アイコン`}
              width={40}
              height={40}
              className="rounded-full"
            />
            <h2 className="text-lg">{space.name}</h2>
          </div>
          <Link
            href={`/spaces/${space.key}/topics`}
            className="btn btn-sm btn-secondary"
          >
            トピック一覧を見る
          </Link>
        </li>
      ))}
    </ul>
  );
}
