"use client";

import { UtensilsCrossed } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ScreenHeader } from "@/components/shared/screen-header";

export default function FoodPage() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <ScreenHeader title="Đặt cơm trưa" subtitle="Đặt hôm nay · nhận trưa mai tại điểm tụ" />
      <EmptyState
        icon={UtensilsCrossed}
        title="Thực đơn đang được cập nhật"
        description="Nhà bếp sẽ đăng món cho ngày mai. Flow đặt cơm + thanh toán VietQR sẽ mở ở giai đoạn tiếp theo."
      />
    </div>
  );
}
