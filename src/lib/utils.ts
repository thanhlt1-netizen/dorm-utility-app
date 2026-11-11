import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "₫";
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return "Hôm nay";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function generateOrderCode(type: "water" | "food") {
  const n = Math.floor(100 + Math.random() * 900);
  return `KTX-${type === "water" ? "W" : "F"}${n}${Date.now() % 100}`;
}

export function generatePickupCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function roleHome(role: "resident" | "staff" | "vendor" | "admin") {
  if (role === "staff") return "/dashboard";
  if (role === "vendor") return "/kitchen";
  return "/";
}
