import { Metadata } from "next";
import GameWrapper from "../ui/GameWrapper";

type Props = {
  searchParams: Promise<{ userName: string }>;
  // params: Promise<{ room_id: string }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  // read route params
  const { userName } = await searchParams;

  // fetch data

  // optionally access and extend (rather than replace) parent metadata
  return {
    title: userName ? `${userName.toUpperCase()}` : "Loup Garou",
  };
}

export default async function PollPage() {
  return (
    <div className="h-full w-full">
      <GameWrapper />
    </div>
  );
}
