import Link from "next/link";
import { TestClient } from "./components/test-client";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <main className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold">Supabase 클라이언트 테스트</h1>
          <p className="text-muted-foreground">
            서버 클라이언트와 브라우저 클라이언트를 테스트합니다
          </p>
        </div>

        <div className="space-y-6">
          {/* 서버 클라이언트 테스트 */}
          <section className="p-6 border rounded-lg space-y-4">
            <h2 className="text-xl font-semibold">서버 클라이언트 테스트</h2>
            <p className="text-sm text-muted-foreground">
              <code className="bg-gray-100 px-2 py-1 rounded">
                src/lib/supabase/server.ts
              </code>
              를 사용합니다
            </p>
            <Link
              href="/api/test-supabase"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              target="_blank"
            >
              서버 클라이언트 테스트 (API)
            </Link>
          </section>

          {/* 브라우저 클라이언트 테스트 */}
          <section className="p-6 border rounded-lg space-y-4">
            <h2 className="text-xl font-semibold">
              브라우저 클라이언트 테스트
            </h2>
            <p className="text-sm text-muted-foreground">
              <code className="bg-gray-100 px-2 py-1 rounded">
                src/lib/supabase/client.ts
              </code>
              를 사용합니다
            </p>
            <TestClient />
          </section>
        </div>
      </main>
    </div>
  );
}
