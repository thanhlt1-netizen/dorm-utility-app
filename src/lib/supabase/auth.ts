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
  const normalizedEmail = email.trim().toLowerCase();

  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizedEmail, password, ...meta }),
  });
  const json = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new Error(json?.error ?? "Đăng ký thất bại.");
  }

  const user = await signInWithPassword(normalizedEmail, password);
  return { needsEmailConfirmation: false, user };
}

export async function verifySignupOtp(
  email: string,
  token: string
): Promise<User> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase chưa được cấu hình");

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });
  if (error) throw error;
  if (!data.user) throw new Error("Mã OTP không hợp lệ.");

  return fetchProfile(data.user.id);
}

export async function resendSignupOtp(email: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase chưa được cấu hình");

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });
  if (error) throw error;
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
