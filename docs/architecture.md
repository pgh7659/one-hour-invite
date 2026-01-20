# 아키텍처 개요

## 개요

Next.js App Router 기반의 Server-First 아키텍처를 따릅니다. React Server Components를 기본으로 하며, 클라이언트 컴포넌트는 필요한 경우에 사용합니다.

## 핵심 원칙

### Server-First

> "If it can be server-rendered, it should be server-rendered.  
> Client-side code is an exception, not the default."

- 모든 컴포넌트는 기본적으로 Server Component
- `"use client"`는 다음 경우에 사용:
  - 브라우저 전용 API (window, document)
  - 로컬 인터랙티브 상태 (onChange, 애니메이션)
  - 클라이언트 전용 라이브러리
  - 사용자 인터랙션 처리 (폼 제출, 버튼 클릭 등)

### Route-Segment Colocation

> "The route is the feature boundary."

각 App Router 라우트 세그먼트가 해당 라우트에 필요한 모든 UI, 로직, 타입, 데이터 접근 코드를 소유합니다.

## 파일 구조

### 루트 구조

```
one-hour-invite/
├── src/
│   ├── app/              # Next.js App Router 라우트
│   ├── lib/              # 공유 유틸리티
│   │   ├── env.ts        # 환경변수 검증
│   │   ├── providers/    # React Provider 컴포넌트
│   │   ├── query-client.ts
│   │   └── supabase/     # Supabase 클라이언트 팩토리
│   └── proxy.ts          # Next.js Proxy (인증/세션 관리)
├── docs/                 # 프로젝트 문서
├── .cursor/rules/        # Cursor IDE 규칙
├── .env.example          # 환경변수 템플릿
├── biome.json            # Biome 설정
├── next.config.ts        # Next.js 설정
├── package.json
└── tsconfig.json
```

### 라우트 세그먼트 구조

각 라우트(`src/app/<route>/`)는 다음 구조를 가집니다:

```
src/app/<route>/
├── page.tsx              # 라우트 페이지 컴포넌트
├── layout.tsx            # 라우트 레이아웃 (선택)
├── loading.tsx           # 로딩 UI (선택)
├── error.tsx             # 에러 UI (선택)
├── components/           # 라우트 전용 UI 컴포넌트
├── api/                  # 데이터 접근 및 뮤테이션
│   ├── actions.server.ts # Server Actions
│   ├── mutations.ts      # 데이터베이스 뮤테이션
│   └── queries.ts        # 데이터 쿼리
├── domain/               # 순수 비즈니스 로직 (React 없음, I/O 없음)
├── hooks/                # 라우트 전용 훅 (클라이언트 전용)
└── types/                # 타입 및 스키마
```

### 공유 코드

여러 라우트에서 사용되는 코드는 `src/lib/` 또는 `src/shared/`에 배치합니다.

```
src/lib/
├── env.ts                # 환경변수 검증 및 타입
├── supabase/
│   ├── server.ts         # 서버용 Supabase 클라이언트
│   └── client.ts         # 클라이언트용 Supabase 클라이언트
├── providers/
│   └── query-provider.tsx # TanStack Query Provider
└── query-client.ts       # QueryClient 팩토리
```

## 라우트 구조

### 현재 라우트

- `/` - 랜딩 페이지
- `/login` - 로그인 페이지
- `/me` - 사용자 마이페이지 (인증 필요)
- `/admin/login` - 관리자 로그인
- `/i/[hash]` - 공개 초대장 보기
- `/i/[hash]/expired` - 만료된 초대장 안내

### 라우트 소유권 규칙

1. 라우트는 자신의 하위 폴더 코드만 소유
2. 다른 라우트의 코드를 직접 import 불가
3. 공유 코드는 `src/lib/` 또는 `src/shared/`에 배치

## 데이터 흐름

### 데이터 페칭

**Server Component에서**:
```typescript
// src/app/me/page.tsx
import { createClient } from "@/lib/supabase/server";

export default async function MePage() {
  const supabase = await createClient();
  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('owner_user_id', user.id);
  
  return <InvitationList invitations={invitations} />;
}
```

**Client Component에서** 
```typescript
// src/app/me/components/invitation-list.tsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function InvitationList() {
  const { data } = useQuery({
    queryKey: ['invitations'],
    queryFn: fetchInvitations,
  });
  
  return <div>{/* ... */}</div>;
}
```

### 뮤테이션 (Server Actions)

```typescript
// src/app/me/api/actions.server.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createInvitationSchema } from "./types";

export async function createInvitationAction(input: unknown) {
  // 1. 검증
  const validated = createInvitationSchema.parse(input);
  
  // 2. 권한 확인
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } };
  }
  
  // 3. 데이터베이스 뮤테이션
  const { data, error } = await supabase
    .from('invitations')
    .insert({ ...validated, owner_user_id: user.id })
    .select()
    .single();
  
  if (error) {
    return { ok: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
  
  // 4. 캐시 무효화
  revalidatePath('/me');
  
  return { ok: true, data };
}
```

### 클라이언트에서 Server Action 호출

```typescript
// src/app/me/components/create-form.tsx
"use client";

import { createInvitationAction } from "../api/actions.server";
import { useForm } from "react-hook-form";

export function CreateForm() {
  const form = useForm();
  
  async function onSubmit(data: unknown) {
    const result = await createInvitationAction(data);
    if (result.ok) {
      // 성공 처리
    } else {
      // 에러 처리
    }
  }
  
  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* ... */}</form>;
}
```

## 컴포넌트 계층

### Server Component (기본)

- 데이터 페칭
- 데이터베이스 접근
- 인증 확인
- SEO 최적화

### Client Component (필요 시)

- 사용자 인터랙션 처리
- 브라우저 API 사용
- 상태 관리 (useState, useReducer)
- 이벤트 핸들러
- 폼 제출 및 검증

## 인증 및 권한

### Proxy를 통한 세션 관리

`src/proxy.ts`에서 모든 요청에 대해:
1. 세션 확인 및 갱신
2. 보호된 라우트 접근 제어
3. 관리자 라우트 Email Allowlist 확인

### 라우트 보호

- `/me`, `/admin`: 인증 필요
- `/admin`: 추가로 Email Allowlist 확인

자세한 내용은 [authentication.md](./authentication.md) 참고.

## 캐싱 전략

### Next.js 캐싱

- Server Components는 기본적으로 캐시됨
- `revalidatePath()`, `revalidateTag()`로 명시적 무효화

### TanStack Query

- 클라이언트 사이드 데이터 캐싱
- 서버 데이터와 동기화

## 타입 안전성

### 환경변수

`src/lib/env.ts`에서 Zod로 런타임 검증:
- 필수 환경변수 누락 시 즉시 에러
- 타입 안전한 환경변수 접근

### 폼 검증

- Zod 스키마로 클라이언트/서버 양쪽 검증
- `react-hook-form`과 `zodResolver` 통합

## 데이터베이스 접근

### Supabase 클라이언트

**서버**:
```typescript
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
```

**클라이언트**:
```typescript
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
```

### RLS (Row Level Security)

- `invitations` 테이블에 RLS 활성화
- `auth.uid()`를 사용한 사용자별 데이터 접근 제어

자세한 내용은 [database.md](./database.md) 참고.

## 에러 처리

### Server Actions

```typescript
{
  ok: true,
  data: T
} | {
  ok: false,
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  }
}
```

### 에러 페이지

- `error.tsx`: 라우트 레벨 에러 UI
- `loading.tsx`: 로딩 상태 UI

## 개발 워크플로우

1. 라우트 세그먼트 생성
2. 필요한 폴더 구조 생성 (`components/`, `api/`, `domain/`, `types/`)
3. Server Component로 페이지 구현
4. 필요한 경우 Server Action 생성
5. 클라이언트 인터랙션이 필요한 경우에만 Client Component 추가

## 참고 문서

- [database.md](./database.md) - 데이터베이스 구조
- [authentication.md](./authentication.md) - 인증 처리
- [environment.md](./environment.md) - 환경변수 설정
- [setup.md](./setup.md) - 프로젝트 셋업
