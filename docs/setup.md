# 프로젝트 셋업 가이드

## 사전 요구사항

- Node.js 20 이상
- pnpm 10.0.0 이상
- Supabase 계정 및 프로젝트

## 초기 설정

### 1. 저장소 클론

```bash
git clone <repository-url>
cd one-hour-invite
```

### 2. 패키지 설치

```bash
pnpm install
```

**주의**: `package.json`의 `preinstall` 스크립트로 인해 `pnpm`만 사용 가능합니다.

### 3. 환경변수 설정

`.env.example`을 복사하여 `.env.local` 생성:

```bash
cp .env.example .env.local
```

`.env.local` 파일을 편집하여 Supabase 키를 설정:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

### 4. Supabase 프로젝트 설정

#### 데이터베이스 마이그레이션

Supabase Dashboard → SQL Editor에서 마이그레이션 실행:

1. `invitations` 테이블 생성
2. `payments` 테이블 생성
3. `rsvps` 테이블 생성
4. `audit_logs` 테이블 생성
5. `admins` 테이블 생성
6. RLS 정책 설정
7. 데이터베이스 함수 생성

자세한 내용은 [database.md](./database.md) 참고.

#### 초기 관리자 설정

초기 super-admin을 DB에서 직접 추가합니다:

```sql
-- 사용자 ID 확인 (auth.users 테이블에서)
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- super-admin 추가
INSERT INTO admins (user_id, email, is_super_admin)
VALUES ('user_id_from_auth_users', 'your-email@example.com', true);
```

#### Auth 설정

Supabase Dashboard → Authentication → Providers:

1. Email provider 활성화
2. Email OTP 설정 확인

### 5. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속하여 확인합니다.

## 필요한 도구 및 패키지

### 필수 패키지

#### 프레임워크 및 런타임

- `next`: Next.js 프레임워크
- `react`: React 라이브러리
- `react-dom`: React DOM 렌더러

#### 데이터베이스 및 인증

- `@supabase/supabase-js`: Supabase 클라이언트
- `@supabase/ssr`: Supabase SSR 지원

#### 폼 및 검증

- `react-hook-form`: 폼 상태 관리
- `@hookform/resolvers`: react-hook-form 리졸버
- `zod`: 런타임 검증 및 타입 추론

#### 데이터 페칭

- `@tanstack/react-query`: 클라이언트 사이드 데이터 페칭
- `@tanstack/react-query-devtools`: React Query 개발자 도구

### 개발 도구

- `@biomejs/biome`: 린터 및 포매터
- `typescript`: 타입 체크
- `tailwindcss`: CSS 프레임워크
- `@tailwindcss/postcss`: Tailwind PostCSS 플러그인

## 개발 환경 설정

### VS Code 설정

`.vscode/settings.json`이 자동으로 설정되어 있습니다:

- Biome을 기본 포매터로 사용
- 저장 시 자동 포맷팅
- 저장 시 import 정렬

### Biome 설정

`biome.json`에서 린팅 및 포매팅 규칙을 설정합니다.

**명령어**:
```bash
pnpm lint          # 린트 체크
pnpm format        # 포맷팅
```

### TypeScript 설정

`tsconfig.json`에서 TypeScript 설정을 관리합니다.

**명령어**:
```bash
pnpm typecheck     # 타입 체크 (package.json에 스크립트 추가 필요)
```

## 프로젝트 구조 이해

### 라우트 구조

각 라우트는 `src/app/<route>/` 디렉토리에 위치하며, 다음 구조를 가집니다:

```
src/app/<route>/
├── page.tsx
├── components/
├── api/
├── domain/
├── hooks/
└── types/
```

자세한 내용은 [architecture.md](./architecture.md) 참고.

### 공유 코드

- `src/lib/env.ts`: 환경변수 검증
- `src/lib/supabase/`: Supabase 클라이언트 팩토리
- `src/lib/providers/`: React Provider 컴포넌트

## 개발 워크플로우

### 1. 새 라우트 생성

```bash
mkdir -p src/app/new-route/{components,api,domain,hooks,types}
touch src/app/new-route/page.tsx
```

### 2. Server Component 작성

```typescript
// src/app/new-route/page.tsx
import { createClient } from "@/lib/supabase/server";

export default async function NewRoutePage() {
  const supabase = await createClient();
  // 데이터 페칭
  return <div>{/* ... */}</div>;
}
```

### 3. Server Action 작성

```typescript
// src/app/new-route/api/actions.server.ts
"use server";

export async function myAction(input: unknown) {
  // 검증 및 뮤테이션
  return { ok: true, data: {} };
}
```

### 4. Client Component 작성 (필요한 경우)

```typescript
// src/app/new-route/components/my-component.tsx
"use client";

export function MyComponent() {
  // 인터랙티브 UI
  return <div>{/* ... */}</div>;
}
```

## 데이터베이스 작업

### 마이그레이션 실행

Supabase Dashboard → SQL Editor에서 SQL 실행:

1. 테이블 생성/수정
2. RLS 정책 추가/수정
3. 함수 생성/수정

### 로컬 개발용 데이터

Supabase Dashboard → Table Editor에서 직접 데이터 추가/수정 가능합니다.

## 인증 테스트

### 개발 모드

- `NODE_ENV=development`일 때 인증 체크 자동 스킵
- 또는 `SKIP_AUTH_CHECK=true` 설정

### 프로덕션 모드

- 모든 인증 체크 활성화
- Email OTP로 로그인 필요

자세한 내용은 [authentication.md](./authentication.md) 참고.

## 문제 해결

### 패키지 설치 오류

**에러**: `npm install` 또는 `yarn install` 실행 시 오류

**해결**: `pnpm`만 사용 가능합니다. `pnpm install` 실행.

### 환경변수 오류

**에러**: `Invalid environment variables`

**해결**:
1. `.env.local` 파일 확인
2. 필수 환경변수가 모두 설정되었는지 확인
3. [environment.md](./environment.md) 참고

### Supabase 연결 오류

**에러**: Supabase 클라이언트 생성 실패

**해결**:
1. `.env.local`의 Supabase URL 및 키 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 네트워크 연결 확인

### 타입 에러

**에러**: TypeScript 타입 에러

**해결**:
1. `pnpm install` 재실행
2. VS Code 재시작
3. TypeScript 서버 재시작 (VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server")

## 다음 단계

- [architecture.md](./architecture.md) - 아키텍처 이해
- [database.md](./database.md) - 데이터베이스 구조
- [authentication.md](./authentication.md) - 인증 처리
- [environment.md](./environment.md) - 환경변수 설정
