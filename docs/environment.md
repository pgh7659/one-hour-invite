# 환경변수

## 개요

프로젝트에서 사용하는 환경변수는 `src/lib/env.ts`에서 Zod로 검증합니다. 런타임에 필수 환경변수가 누락되면 즉시 에러가 발생합니다.

## 환경변수 목록

### Public (브라우저 노출 가능)

#### NEXT_PUBLIC_SUPABASE_URL

**타입**: `string` (URL)  
**필수**: Yes  
**설명**: Supabase 프로젝트 URL

**설정 방법**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

**사용 위치**: 브라우저 및 서버

#### NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

**타입**: `string`  
**필수**: Yes  
**설명**: Supabase Publishable Key (새 키 시스템)

**설정 방법**:
```bash
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

**사용 위치**: 브라우저 및 서버  
**주의**: 브라우저에 노출되지만 RLS로 보호됩니다.

### Server-only (서버 전용)

**참고**: 관리자 목록은 환경변수가 아닌 `admins` 테이블에서 관리합니다. 자세한 내용은 [database.md](./database.md) 참고.

#### SUPABASE_SECRET_KEY

**타입**: `string`  
**필수**: No (선택)  
**설명**: Supabase Secret Key (새 키 시스템). 관리자 작업에만 사용

**설정 방법**:
```bash
SUPABASE_SECRET_KEY=sb_secret_...
```

**사용 위치**: 서버 전용 (절대 브라우저에 노출 금지)  
**용도**: Edge Functions, 관리자 작업 등


#### SKIP_AUTH_CHECK

**타입**: `string` (`"true"`일 때만 활성화)  
**필수**: No (선택)  
**설명**: 개발/테스트용 인증 체크 스킵

**설정 방법**:
```bash
SKIP_AUTH_CHECK=true
```

**사용 위치**: 서버 전용 (`src/proxy.ts`)  
**주의**: 프로덕션에서는 사용하지 않습니다.

### 자동 설정

#### NODE_ENV

**타입**: `"development" | "production" | "test"`  
**설정**: Next.js가 자동으로 설정  
**기본값**: `"development"` (설정되지 않은 경우)

**동작**:
- `next dev`: `"development"`
- `next build`: `"production"`
- `next start`: `"production"`

## 환경변수 파일

### .env.local

로컬 개발 환경에서 사용하는 환경변수를 저장합니다. Git에 커밋하지 않습니다.

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
ADMIN_EMAIL_ALLOWLIST=admin@example.com
SKIP_AUTH_CHECK=true
```

### .env.example

프로젝트에 필요한 환경변수 목록을 명시합니다. Git에 커밋됩니다.

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
ADMIN_EMAIL_ALLOWLIST=
SKIP_AUTH_CHECK=true
```

## 환경변수 접근

### Public 환경변수

```typescript
import { publicEnv } from "@/lib/env";

// 브라우저 및 서버에서 사용 가능
const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
```

### Server-only 환경변수

```typescript
import { serverEnv } from "@/lib/env";

// 서버에서만 사용 가능
const secretKey = serverEnv.SUPABASE_SECRET_KEY;
const adminEmails = serverEnv.ADMIN_EMAIL_ALLOWLIST;
const isDevelopment = serverEnv.NODE_ENV === "development";
const skipAuth = serverEnv.SKIP_AUTH_CHECK;
```

## 개발/프로덕션 차이

### 개발 환경

- `NODE_ENV=development` (자동 설정)
- `SKIP_AUTH_CHECK=true` 설정 가능 (선택)
- 인증 체크 자동 스킵 (`NODE_ENV=development`일 때)

### 프로덕션 환경

- `NODE_ENV=production` (자동 설정)
- 모든 인증 체크 활성화
- `SKIP_AUTH_CHECK` 무시됨

## Supabase 키 시스템

### 새 키 시스템 (권장)

- **Publishable Key**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - 브라우저에 노출 가능
  - RLS로 보호됨
  - 형식: `sb_publishable_...`

- **Secret Key**: `SUPABASE_SECRET_KEY`
  - 서버 전용
  - RLS 우회 가능
  - 형식: `sb_secret_...`

### 레거시 키 시스템 (사용 안 함)

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (사용 안 함)
- `SUPABASE_SERVICE_ROLE_KEY` (사용 안 함)

## 환경변수 검증

`src/lib/env.ts`에서 Zod로 런타임 검증:

```typescript
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  // ...
});

const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // ...
});
```

**에러 발생 시**:
- 앱 시작 시 즉시 에러 발생
- 명확한 에러 메시지 제공
- 누락된 환경변수 식별 가능

## 보안 고려사항

### Public 환경변수

- `NEXT_PUBLIC_*` 접두사는 브라우저에 노출됨
- 민감한 정보는 포함하지 않음
- RLS로 데이터 접근 제어

### Secret 환경변수

- 서버에서만 사용
- 절대 브라우저에 노출 금지
- Git에 커밋하지 않음 (`.env.local`은 `.gitignore`에 포함)

## 배포 환경 설정

### Vercel

1. 프로젝트 설정 → Environment Variables
2. 환경변수 추가
3. 환경별로 다른 값 설정 가능 (Production, Preview, Development)

### 기타 플랫폼

각 플랫폼의 환경변수 설정 방법에 따라 설정합니다.

## 문제 해결

### 환경변수 누락 에러

```
Error: Invalid environment variables
```

**해결 방법**:
1. `.env.local` 파일 확인
2. 필수 환경변수가 모두 설정되었는지 확인
3. `src/lib/env.ts`의 스키마 확인

### 타입 에러

환경변수는 `publicEnv`와 `serverEnv`를 통해 타입 안전하게 접근합니다.

```typescript
// ❌ 잘못된 방법
const url = process.env.NEXT_PUBLIC_SUPABASE_URL; // string | undefined

// ✅ 올바른 방법
const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL; // string
```
