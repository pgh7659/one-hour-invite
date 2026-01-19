"use client";

import { useState } from "react";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export function TestClient() {
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    env?: Record<string, string>;
    auth?: {
      user: { id: string; email: string | undefined } | null;
      error: string | null;
    };
    timestamp?: string;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleTest() {
    setLoading(true);
    setResult(null);

    try {
      const supabase = createClient();

      // Test 1: Check environment variables
      const envCheck = {
        url: publicEnv.NEXT_PUBLIC_SUPABASE_URL ? "✅ 설정됨" : "❌ 누락",
        key: publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          ? "✅ 설정됨"
          : "❌ 누락",
      };

      // Test 2: Check if Supabase client is created successfully
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      setResult({
        success: true,
        message: "브라우저 클라이언트 테스트 성공",
        env: envCheck,
        auth: {
          user: user ? { id: user.id, email: user.email } : null,
          error: authError?.message ?? null,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setResult({
        success: false,
        message: "브라우저 클라이언트 테스트 실패",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "테스트 중..." : "브라우저 클라이언트 테스트"}
      </button>

      {result && (
        <div
          className={`p-4 rounded border ${
            result.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <h3 className="font-semibold mb-2">{result.message}</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
