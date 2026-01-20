# 인증 처리

## 개요

Supabase Auth를 사용하여 인증을 처리합니다. Email OTP(One-Time Password) 방식을 사용하며, Server-First 아키텍처를 따릅니다.

## 인증 방식

### Email OTP

비밀번호 없이 이메일로 OTP를 받아 로그인합니다. Supabase Auth의 `signInWithOtp()`를 사용합니다.

**특징**:
- 비밀번호 관리 불필요
- 보안성 향상
- 회원가입과 로그인 구분 없음 (Supabase가 자동 처리)

## Supabase Client 생성

### 서버 사이드

**파일**: `src/lib/supabase/server.ts`  
**사용 위치**: Server Components, Server Actions, Route Handlers

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

**특징**:
- Cookie 기반 세션 관리
- `@supabase/ssr`의 `createServerClient` 사용
- Next.js의 `cookies()` API 사용

### 클라이언트 사이드

**파일**: `src/lib/supabase/client.ts`  
**사용 위치**: Client Components (`"use client"`)

```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

**특징**:
- Browser client 생성
- `@supabase/ssr`의 `createBrowserClient` 사용

## 세션 관리

### Proxy를 통한 세션 갱신

`src/proxy.ts`에서 모든 요청에 대해 세션을 확인하고 갱신합니다.

**동작**:
1. 모든 요청에 대해 세션 확인
2. 만료된 세션이 있으면 자동 갱신
3. 쿠키 업데이트

```typescript
// src/proxy.ts
const { data: { user } } = await supabase.auth.getUser();
```

### 보호된 라우트

#### `/me`, `/admin` 라우트 보호

인증되지 않은 사용자는 `/login`으로 리다이렉트됩니다.

```typescript
if (!isDevelopment && !skipAuth) {
  if (
    request.nextUrl.pathname.startsWith("/me") ||
    request.nextUrl.pathname.startsWith("/admin")
  ) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
}
```

#### `/admin` 라우트 추가 보호

`admins` 테이블을 통해 관리자만 접근 가능합니다.

```typescript
if (request.nextUrl.pathname.startsWith("/admin") && user) {
  const userIsAdmin = await isAdmin(user.id);
  if (!userIsAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
```

**관리자 설정**: `admins` 테이블에서 관리합니다. 자세한 내용은 [database.md](./database.md) 참고.

## 개발 모드

개발 편의를 위해 인증 체크를 스킵할 수 있습니다.

**방법 1**: 환경변수 설정
```bash
# .env.local
SKIP_AUTH_CHECK=true
```

**방법 2**: 개발 모드 (`NODE_ENV=development`)에서는 자동으로 스킵됩니다.

## 인증 플로우

### 1. 로그인 요청

```typescript
// Client Component 또는 Server Action
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
});
```

### 2. OTP 확인

```typescript
const { error } = await supabase.auth.verifyOtp({
  email: 'user@example.com',
  token: '123456', // 사용자가 입력한 OTP
  type: 'email',
});
```

### 3. 세션 확인

```typescript
// Server Component 또는 Server Action
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();

if (user) {
  // 인증됨
  console.log(user.id, user.email);
}
```

### 4. 로그아웃

```typescript
const { error } = await supabase.auth.signOut();
```

## 권한 확인 패턴

### Server Component에서

```typescript
import { createClient } from "@/lib/supabase/server";

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // 인증된 사용자만 접근 가능
  return <div>Hello, {user.email}</div>;
}
```

### Server Action에서

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateInvitationAction(id: string, data: unknown) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { ok: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } };
  }
  
  // 권한 확인 및 업데이트 로직
  // ...
}
```

### Client Component에서

```typescript
"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function UserInfo() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);
  
  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }
  
  return <div>Hello, {user.email}</div>;
}
```

## 보안 고려사항

### Server-First 원칙

- 인증 확인은 서버에서 수행
- 클라이언트 인증 확인은 UI 표시용으로만 사용
- 실제 권한 체크는 Server Action에서 수행

### RLS (Row Level Security)

- 데이터베이스 레벨에서 권한 제어
- `auth.uid()`를 사용하여 사용자별 데이터 접근 제한

### 환경변수 관리

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: 브라우저에 노출 가능
- `SUPABASE_SECRET_KEY`: 서버에서만 사용 (브라우저 노출 금지)

## 에러 처리

### 인증 실패 시

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
});

if (error) {
  // 에러 처리
  console.error('인증 실패:', error.message);
  return { ok: false, error: { code: error.code, message: error.message } };
}
```

### 세션 만료 시

Proxy에서 자동으로 세션을 갱신하지만, 만약 갱신에 실패하면:

```typescript
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  // 세션 만료 또는 인증 실패
  redirect('/login');
}
```

## 참고 자료

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Supabase SSR 문서](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Middleware 문서](https://nextjs.org/docs/app/building-your-application/routing/middleware)
