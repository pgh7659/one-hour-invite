import { NextResponse } from "next/server";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Test 1: Check if Supabase client is created successfully
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Test 2: Check environment variables
    const envCheck = {
      url: publicEnv.NEXT_PUBLIC_SUPABASE_URL ? "✅ 설정됨" : "❌ 누락",
      key: publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        ? "✅ 설정됨"
        : "❌ 누락",
    };

    // Test 3: Try a simple query (if you have a table)
    // const { data, error: queryError } = await supabase
    //   .from('your_table')
    //   .select('count')
    //   .limit(1);

    return NextResponse.json({
      success: true,
      message: "서버 클라이언트 테스트 성공",
      client: "server.ts",
      env: envCheck,
      auth: {
        user: user ? { id: user.id, email: user.email } : null,
        error: authError?.message ?? null,
      },
      timestamp: new Date().toISOString(),
      // query: {
      //   data,
      //   error: queryError?.message ?? null,
      // },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "서버 클라이언트 테스트 실패",
        client: "server.ts",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
