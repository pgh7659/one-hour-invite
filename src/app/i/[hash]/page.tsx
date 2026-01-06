export default function InvitationPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="text-center">
        <h1 className="text-3xl font-semibold">Invitation</h1>
        <p className="mt-4 text-muted-foreground">Invitation page placeholder</p>
      </main>
    </div>
  );
}

