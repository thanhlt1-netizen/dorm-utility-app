import type { User } from "@/types";
import type { Role } from "@/types";
import { getSupabase } from "./client";

const ROLES: Role[] = ["resident", "staff", "vendor", "admin"];

interface ProfileRow {
  id: string;
  full_name: string;
  phone: string;
  room_number: string;
  role: string;
  student_id: string;
  avatar_url: string | null;
}

function mapProfile(row: ProfileRow): User {
  const role = ROLES.includes(row.role as Role) ? (row.role as Role) : "resident";
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    roomNumber: row.room_number,
    role,
    studentId: row.student_id,
    avatarUrl: row.avatar_url ?? undefined,
  };
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<User> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase chưa được cấu hình");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    throw profileError ?? new Error("Không tìm thấy hồ sơ người dùng");
  }
  return mapProfile(profile as ProfileRow);
}

export async function signUpWithProfile(
  email: string,
  password: string,
  meta: { fullName: string; phone: string; roomNumber: string; studentId: string }
): Promise<{ needsEmailConfirmation: boolean; user: User | null }> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase chưa được cấu hình");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: meta.fullName,
        phone: meta.phone,
        room_number: meta.roomNumber,
        student_id: meta.studentId,
        role: "resident",
      },
    },
  });
  if (error) throw error;

  if (!data.session || !data.user) {
    return { needsEmailConfirmation: true, user: null };
  }

  const user = await fetchProfile(data.user.id);
  return { needsEmailConfirmation: false, user };
}

export async function fetchProfile(userId: string): Promise<User> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase chưa được cấu hình");

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw error ?? new Error("Không tìm thấy hồ sơ người dùng");
  }
  return mapProfile(data as ProfileRow);
}

export async function initAuth(): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  const sessionUser = data.session?.user;
  if (!sessionUser) return null;

  return fetchProfile(sessionUser.id);
}

export async function signOutSupabase(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}
