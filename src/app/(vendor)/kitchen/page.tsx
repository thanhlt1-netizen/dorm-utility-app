"use client";

import { ChefHat } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function VendorKitchenPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <EmptyState
        icon={ChefHat}
        title="Khu vực Nhà bếp"
        description="Quản lý thực đơn ngày mai và danh sách đơn đã thanh toán sẽ mở ở giai đoạn tiếp theo."
      />
    </div>
  );
}
