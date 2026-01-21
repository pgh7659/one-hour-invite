# One Hour Invite

다양한 종류의 초대장을 생성하고 관리하는 서비스입니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email OTP)
- **Styling**: Tailwind CSS
- **Form**: react-hook-form + zod
- **Data Fetching**: TanStack Query
- **Linting/Formatting**: Biome

## 빠른 시작

### 사전 요구사항

- Node.js 20 이상
- pnpm 10.0.0 이상
- Supabase 계정 및 프로젝트

### 설치 및 실행

```bash
# 패키지 설치
pnpm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 Supabase 키 설정

# 개발 서버 실행
pnpm dev
```

자세한 셋업 가이드는 [docs/setup.md](./docs/setup.md)를 참고하세요.

## 프로젝트 문서

### 아키텍처 및 구조

- **[architecture.md](./docs/architecture.md)** - 전체 아키텍처 개요
  - Server-First 원칙
  - 라우트 구조 및 co-location 패턴
  - 파일 구조 설명
  - 데이터 흐름

### 데이터베이스

- **[database.md](./docs/database.md)** - 데이터베이스 구조 및 역할
  - 테이블 구조 (invitations, payments, rsvps, audit_logs)
  - RLS (Row Level Security) 정책
  - 데이터베이스 함수
  - 자동 만료 처리

### 인증

- **[authentication.md](./docs/authentication.md)** - 인증 처리 방식
  - Email OTP 방식
  - Supabase Client 생성 (서버/클라이언트)
  - 세션 관리
  - 보호된 라우트
  - 권한 확인 패턴

### 환경변수

- **[environment.md](./docs/environment.md)** - 환경변수 설명
  - 각 환경변수의 역할
  - 설정 방법
  - 개발/프로덕션 차이

### 셋업 가이드

- **[setup.md](./docs/setup.md)** - 프로젝트 셋업 가이드
  - 초기 설정 단계
  - 필요한 도구 및 패키지
  - 개발 환경 설정

## 주요 기능

- 게스트 모드 초대장 생성 (1시간 무료 사용)
- 결제 후 소유권 주장
- Email OTP 인증
- RSVP (참석 여부) 응답
- 자동 만료 처리

## 개발 명령어

```bash
pnpm dev          # 개발 서버 실행
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버 실행
pnpm lint         # 린트 체크
pnpm format       # 코드 포맷팅
```

## 프로젝트 구조

```
one-hour-invite/
├── src/
│   ├── app/              # Next.js App Router 라우트
│   ├── lib/              # 공유 유틸리티
│   └── proxy.ts          # 인증/세션 관리
├── docs/                 # 프로젝트 문서
└── .cursor/rules/        # Cursor IDE 규칙
```

자세한 구조는 [architecture.md](./docs/architecture.md)를 참고하세요.

## 라이선스

Private
