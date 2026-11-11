"use client";

import { HardHat } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function StaffDashboardPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <EmptyState
        icon={HardHat}
        title="Bảng điều khiển Trực ca"
        description="Hàng đợi đổi nước, nhận việc và hoàn tác sẽ mở ở giai đoạn tiếp theo."
      />
    </div>
  );
}
