export type Role = "resident" | "staff" | "vendor" | "admin";

export type OrderType = "water" | "food";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "ready"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid";

export type PaymentMethod = "cash" | "bank_transfer";

export interface User {
  id: string;
  fullName: string;
  phone: string;
  roomNumber: string;
  role: Role;
  studentId: string;
  avatarUrl?: string;
}

export interface WaterOrderDetails {
  bottleCount: number;
  assignedStaffId?: string;
  assignedStaffName?: string;
  completedAt?: string;
}

export interface FoodOrderItem {
  dishId: string;
  dishName: string;
  price: number;
  quantity: number;
}

export interface FoodOrderDetails {
  dishes: FoodOrderItem[];
  pickupDate: string;
  pickupTimeSlot: string;
}

export interface Order {
  id: string;
  code: string;
  userId: string;
  userName: string;
  roomNumber: string;
  type: OrderType;
  status: OrderStatus;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  pickupCode?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  waterDetails?: WaterOrderDetails;
  foodDetails?: FoodOrderDetails;
}

export interface DailyMenu {
  id: string;
  date: string;
  dishName: string;
  description: string;
  price: number;
  imageUrl: string;
  maxQuantity: number;
  remaining: number;
  isActive: boolean;
  nutritionTags: string[];
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Chờ tiếp nhận",
  confirmed: "Đã xác nhận",
  in_progress: "Đang xử lý",
  ready: "Sẵn sàng lấy",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export const ROLE_LABEL: Record<Role, string> = {
  resident: "Sinh viên",
  staff: "Ban quản lý",
  vendor: "Nhà bếp",
  admin: "Quản lý KTX",
};
