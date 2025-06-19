import GameProvider from "@/app/ui/GameProvider";

export default async function Layout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ room_id: string }>;
}>) {
  const { room_id } = await params;

  return (
    <div className="h-full w-full">
      <GameProvider roomId={room_id}>{children}</GameProvider>
    </div>
  );
}
