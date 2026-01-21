import { createClient } from "@/lib/supabase/server";

/**
 * 사용자가 관리자인지 확인합니다.
 * @param userId 사용자 ID (auth.users.id)
 * @returns 관리자 여부
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin", {
    user_id_param: userId,
  });

  if (error) {
    console.error("관리자 확인 오류:", error);
    return false;
  }

  return data ?? false;
}

/**
 * 사용자가 super-admin인지 확인합니다.
 * @param userId 사용자 ID (auth.users.id)
 * @returns super-admin 여부
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_super_admin", {
    user_id_param: userId,
  });

  if (error) {
    console.error("super-admin 확인 오류:", error);
    return false;
  }

  return data ?? false;
}

/**
 * 현재 로그인한 사용자가 관리자인지 확인합니다.
 * @returns 관리자 여부
 */
export async function checkCurrentUserIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  return isAdmin(user.id);
}

/**
 * 현재 로그인한 사용자가 super-admin인지 확인합니다.
 * @returns super-admin 여부
 */
export async function checkCurrentUserIsSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  return isSuperAdmin(user.id);
}
