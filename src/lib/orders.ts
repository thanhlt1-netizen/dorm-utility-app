import type { Order } from "@/types";
import { seedOrders } from "@/lib/mock-data";
import { sleep } from "@/lib/utils";

export async function fetchOrders(): Promise<Order[]> {
  await sleep(700);
  return seedOrders;
}
