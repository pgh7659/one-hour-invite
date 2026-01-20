# 데이터베이스 구조

## 개요

Supabase PostgreSQL을 사용하여 초대장 서비스의 데이터를 관리합니다. 게스트 모드와 결제 후 소유권 주장 기능을 지원합니다.

## 테이블 구조

### 1. invitations

초대장 정보를 저장하는 메인 테이블. 게스트 모드로 생성 가능하며, 결제 후 소유권 주장 가능.

#### 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | 초대장 고유 ID (UUID) |
| `hash` | text | 공개 URL에 사용되는 해시값. `/i/{hash}` 형태로 접근 가능하며, 고유해야 함. |
| `status` | text | 초대장 상태: `draft`(초안, 게스트), `paid`(결제 완료), `expired`(만료), `blocked`(차단됨) |
| `owner_user_id` | uuid | 초대장 소유자 ID. 게스트 모드일 경우 NULL이며, 결제 후 `auth.users.id`로 설정됨. |
| `edit_token_hash` | text | 게스트 모드에서 초대장 수정을 위한 토큰 해시값. 소유권 주장 전까지 수정 권한 확인에 사용. |
| `template_key` | text | 사용된 템플릿 키 (예: t1, t2 등). 기본값: `t1` |
| `content` | jsonb | 초대장 내용 (JSONB). 이벤트 정보, 날짜/시간, 장소 등 모든 텍스트 정보 포함. |
| `gallery` | jsonb | 초대장 갤러리 이미지 배열 (JSONB). 이미지 URL 또는 파일 경로 저장. |
| `expires_at` | timestamptz | 초대장 만료 시간. 게스트: `created_at + 1시간`, 결제 후: `valid_to` 또는 결제일 + 30일 |
| `event_at` | timestamptz | 이벤트 날짜 및 시간 (예: 결혼식, 생일파티, 기념일 등) |
| `valid_from` | timestamptz | 초대장 공개 시작일. 이 날짜 이전에는 비공개 상태. |
| `valid_to` | timestamptz | 초대장 공개 종료일. 이 날짜 이후에는 비공개 상태. 결제 후 만료일과 동일하게 설정 가능. |
| `created_at` | timestamptz | 초대장 생성 시간 |
| `updated_at` | timestamptz | 초대장 마지막 수정 시간 |

#### 만료 로직

```typescript
// 게스트 모드: created_at + 1시간
expires_at = created_at + INTERVAL '1 hour'

// 결제 후: valid_to 사용 (없으면 결제일 + 30일)
expires_at = valid_to ?? (payment_date + INTERVAL '30 days')
```

### 2. payments

초대장 결제 정보를 저장하는 테이블. 결제 프로바이더별 정보와 상태를 관리합니다.

#### 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | 결제 고유 ID (UUID) |
| `invitation_id` | uuid | 결제 대상 초대장 ID. `invitations` 테이블 참조. |
| `provider` | text | 결제 프로바이더 (예: toss, kakao, stripe 등) |
| `provider_payment_id` | text | 결제 프로바이더에서 발급한 결제 ID. 고유해야 함. |
| `amount` | integer | 결제 금액 (원 단위, 정수) |
| `status` | text | 결제 상태: `requested`(요청됨), `paid`(결제 완료), `failed`(실패), `refunded`(환불됨) |
| `paid_at` | timestamptz | 결제 완료 시간. `status`가 `paid`일 때 설정됨. |
| `raw` | jsonb | 결제 프로바이더로부터 받은 원본 응답 데이터 (JSONB). 디버깅 및 감사 목적. |
| `created_at` | timestamptz | 결제 요청 생성 시간 |

### 3. rsvps

초대장 참석 여부(RSVP) 응답을 저장하는 테이블. 각 응답은 고유한 토큰으로 식별됩니다.

#### 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | RSVP 고유 ID (UUID) |
| `invitation_id` | uuid | 응답 대상 초대장 ID. `invitations` 테이블 참조. |
| `response_token_hash` | text | RSVP 응답을 위한 고유 토큰 해시값. 초대장 링크와 함께 전달되어 응답자 식별에 사용. |
| `attend` | boolean | 참석 여부 (true: 참석, false: 불참) |
| `count` | integer | 참석 인원 수. 0 이상 20 이하. |
| `created_at` | timestamptz | RSVP 응답 생성 시간 |
| `updated_at` | timestamptz | RSVP 응답 마지막 수정 시간 |

### 4. audit_logs

모든 중요한 변경사항을 추적하는 감사 로그 테이블. 액션 수행자, 시간, 변경 내용을 기록합니다.

#### 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | 감사 로그 고유 ID (UUID) |
| `invitation_id` | uuid | 관련 초대장 ID. 시스템 액션의 경우 NULL일 수 있음. |
| `actor` | text | 액션 수행자: `user`(일반 사용자), `admin`(관리자), `system`(시스템 자동 처리) |
| `action` | text | 수행된 액션: `create`, `update`, `delete`, `claim`, `expire`, `payment`, `status_change` 등 |
| `diff` | jsonb | 변경 전후의 차이 (JSONB). `{before: {...}, after: {...}}` 형태로 저장. |
| `created_at` | timestamptz | 로그 생성 시간 |

#### 사용 목적

1. **감사 추적**: 누가, 언제, 무엇을 했는지 기록
2. **디버깅**: 문제 발생 시 변경 이력 추적
3. **보안**: 의심스러운 활동 감지
4. **데이터 복구**: 실수로 삭제/수정된 데이터 복구 가능
5. **사용자 행동 분석**: 서비스 개선을 위한 데이터 수집

## RLS (Row Level Security)

`invitations` 테이블에 RLS가 활성화되어 있습니다.

### 정책

#### invitations 테이블

| 정책명 | 명령 | 조건 | 설명 |
|--------|------|------|------|
| `public_read_by_hash` | SELECT | `true` | 모든 SELECT 허용 (hash로 조회 가능) |
| `anyone_can_create` | INSERT | `true` | 누구나 초대장 생성 가능 (게스트 모드 지원) |
| `edit_by_owner` | UPDATE | `owner_user_id = auth.uid() OR owner_user_id IS NULL` | 소유자 또는 게스트 수정 가능 (게스트는 `edit_token_hash`로 애플리케이션에서 검증) |
| `delete_by_owner` | DELETE | `owner_user_id = auth.uid()` | 소유자만 삭제 가능 |

#### 다른 테이블

`payments`, `rsvps`, `audit_logs`는 RLS가 비활성화되어 있으며, 서버에서만 접근합니다.

## 데이터베이스 함수

### check_invitation_expiration()

만료된 초대장의 `status`를 `expired`로 업데이트합니다.

**시그니처**: `check_invitation_expiration() RETURNS void`

**동작**:
- `expires_at < NOW()` 조건을 만족하는 초대장 조회
- `status`가 `draft` 또는 `paid`인 초대장만 처리
- `status`를 `expired`로 변경

**사용 예시**:
```sql
SELECT check_invitation_expiration();
```

**실행 방법**: Edge Function + Cron 또는 애플리케이션 레벨에서 주기적 실행

### is_invitation_expired(invitation_id uuid)

특정 초대장의 만료 여부를 확인합니다.

**시그니처**: `is_invitation_expired(invitation_id uuid) RETURNS boolean`

**반환값**: `true` (만료됨), `false` (유효함)

**사용 예시**:
```sql
SELECT is_invitation_expired('invitation_id');
```

### calculate_expires_at(created_at, valid_to)

만료 시간을 자동으로 계산합니다.

**시그니처**: `calculate_expires_at(created_at timestamptz, valid_to timestamptz) RETURNS timestamptz`

**로직**:
- `valid_to`가 있으면 사용 (결제 후)
- 없으면 `created_at + INTERVAL '1 hour'` (게스트)

**사용 예시**:
```sql
-- 게스트 모드: +1시간
SELECT calculate_expires_at(NOW(), NULL);

-- 결제 후: valid_to 사용
SELECT calculate_expires_at(NOW(), '2024-12-31'::timestamptz);
```

## 자동 만료 처리

### Edge Function + Cron (권장)

Supabase Dashboard → Edge Functions → Cron Jobs에서 5분마다 실행 설정

```typescript
// supabase/functions/check-expiration/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SECRET_KEY')!
  )
  
  const { error } = await supabase.rpc('check_invitation_expiration')
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 애플리케이션 레벨

- 초대장 조회 시마다 만료 체크
- 백그라운드 작업으로 주기적 실행

## User 테이블

### auth.users 사용

별도의 `public.users` 테이블을 생성하지 않고 Supabase의 `auth.users` 테이블을 사용합니다.

**위치**: `auth` 스키마의 `users` 테이블  
**역할**: 인증 정보 저장 (이메일, 세션 등)  
**접근**: `supabase.auth.getUser()`, `supabase.auth.signInWithOtp()` 등

### 사용 예시

```typescript
// Server Component 또는 Server Action에서
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// user.id를 invitations.owner_user_id에 저장
await supabase.from('invitations').insert({
  owner_user_id: user.id, // auth.users.id 참조
  // ...
});
```

### auth.users 주요 컬럼

- `id` (uuid): 사용자 고유 ID
- `email` (varchar): 이메일 주소
- `email_confirmed_at` (timestamptz): 이메일 확인 시간
- `created_at` (timestamptz): 계정 생성 시간
- `last_sign_in_at` (timestamptz): 마지막 로그인 시간
- `raw_user_meta_data` (jsonb): 사용자 메타데이터

### 프로필 정보가 필요한 경우

사용자 프로필 정보(이름, 프로필 사진, 설정 등)가 필요하면 `public.profiles` 테이블을 생성합니다:

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

현재 프로젝트에서는 이메일만으로 충분하므로 `auth.users`만 사용합니다.

## admins 테이블

관리자 정보를 저장하는 테이블입니다. DB에서 동적으로 관리하며, super-admin 권한을 지원합니다.

### 테이블 구조

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | 관리자 고유 ID (UUID) |
| `user_id` | uuid | 관리자 사용자 ID. `auth.users.id` 참조. 고유해야 함. |
| `email` | text | 관리자 이메일 주소 |
| `is_super_admin` | boolean | super-admin 권한 여부. true일 경우 다른 관리자 추가/삭제 가능. |
| `created_at` | timestamptz | 관리자 추가 시간 |
| `created_by` | uuid | 관리자를 추가한 사용자 ID (super-admin만 가능) |
| `updated_at` | timestamptz | 관리자 정보 마지막 수정 시간 |

### RLS 정책

| 정책명 | 명령 | 조건 | 설명 |
|--------|------|------|------|
| `users_can_check_own_admin_status` | SELECT | `auth.uid() = user_id` | 사용자는 자신이 관리자인지 확인 가능 |
| `super_admin_can_insert` | INSERT | super-admin 권한 필요 | super-admin만 관리자 추가 가능 |
| `super_admin_can_update` | UPDATE | super-admin 권한 필요 | super-admin만 관리자 수정 가능 |
| `super_admin_can_delete` | DELETE | super-admin 권한 필요, 자신 제외 | super-admin만 관리자 삭제 가능 (자신은 삭제 불가) |

### 데이터베이스 함수

#### is_admin(user_id_param uuid)

사용자가 관리자인지 확인합니다.

**시그니처**: `is_admin(user_id_param uuid) RETURNS boolean`

**사용 예시**:
```sql
SELECT is_admin('user_id');
```

#### is_super_admin(user_id_param uuid)

사용자가 super-admin인지 확인합니다.

**시그니처**: `is_super_admin(user_id_param uuid) RETURNS boolean`

**사용 예시**:
```sql
SELECT is_super_admin('user_id');
```

### 초기 관리자 설정

초기 super-admin은 DB에서 직접 추가합니다:

```sql
-- 사용자 ID 확인 (auth.users 테이블에서)
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- super-admin 추가
INSERT INTO admins (user_id, email, is_super_admin)
VALUES ('user_id_here', 'admin@example.com', true);
```

### 관리자 추가 (super-admin만 가능)

super-admin은 다른 관리자를 추가할 수 있습니다:

```sql
-- 일반 관리자 추가
INSERT INTO admins (user_id, email, is_super_admin, created_by)
VALUES ('new_user_id', 'newadmin@example.com', false, 'current_super_admin_id');

-- super-admin 추가
INSERT INTO admins (user_id, email, is_super_admin, created_by)
VALUES ('new_user_id', 'newsuperadmin@example.com', true, 'current_super_admin_id');
```

**주의**: RLS 정책에 의해 super-admin만 INSERT 가능합니다.

### 추후 작업

- [ ] 관리자 관리 UI 구현 (super-admin 권한 필요)
- [ ] super-admin 권한 시스템 구현 (첫 관리자 또는 특정 이메일 기반)
