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

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const KTX_AREAS = ["B1", "B2", "C1"] as const;

export function splitRoomCode(value: string): { area: string; room: string } {
  const match = value.trim().toUpperCase().match(/^([A-Z]\d+)-(.+)$/);
  if (match) return { area: match[1], room: match[2] };
  return { area: "", room: value.trim() };
}

export function roomLabel(value: string) {
  const { area, room } = splitRoomCode(value);
  if (!value) return "";
  return area ? `Tòa ${area} · Phòng ${room}` : `Phòng ${room}`;
}

export function roleHome(role: "resident" | "staff" | "vendor" | "admin") {
  if (role === "staff") return "/dashboard";
  if (role === "vendor") return "/kitchen";
  return "/";
}
