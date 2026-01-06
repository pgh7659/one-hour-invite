export default function ExpiredInvitationPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="text-center">
        <h1 className="text-3xl font-semibold">Expired Invitation</h1>
        <p className="mt-4 text-muted-foreground">This invitation has expired</p>
      </main>
    </div>
  );
}

