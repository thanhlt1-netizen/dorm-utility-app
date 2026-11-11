import { seedUsers } from "@/lib/mock-data";
import type { User } from "@/types";

export const DEMO_PASSWORD = "ktx123456";

export const DEMO_ACCOUNTS: { email: string; password: string; user: User }[] = [
  { email: "sinhvien@dorm.vn", password: DEMO_PASSWORD, user: seedUsers[0] },
  { email: "staff@dorm.vn", password: DEMO_PASSWORD, user: seedUsers[1] },
  { email: "bep@dorm.vn", password: DEMO_PASSWORD, user: seedUsers[2] },
  { email: "admin@dorm.vn", password: DEMO_PASSWORD, user: seedUsers[3] },
];

export function findMockAccount(email: string, password: string) {
  return DEMO_ACCOUNTS.find(
    (a) => a.email === email.toLowerCase() && a.password === password
  );
}
