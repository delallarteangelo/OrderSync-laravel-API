// In-memory mutable database used by MSW handlers. Seeded from src/mock fixtures.
import { mockProducts } from "@/mock/mockProducts";
import { mockCategories } from "@/mock/mockCategories";
import { mockOrders } from "@/mock/mockOrders";
import { mockUsers } from "@/mock/mockUsers";
import { mockMovements } from "@/mock/mockMovements";
import { mockSettings } from "@/mock/mockSettings";
import { mockPosSales } from "@/mock/mockPosSales";
import { mockThreads, mockMessages } from "@/mock/mockMessages";
import type { Product, Category } from "@/shared/types/catalog";
import type { Order } from "@/shared/types/orders";
import type { User } from "@/shared/types/auth";
import type { InventoryMovement } from "@/shared/types/inventory";
import type { BusinessSettings } from "@/shared/types/settings";
import type { PosSale } from "@/shared/types/pos";
import type {
  ChatThread,
  Message,
  NotificationPreferences,
  RealtimeEvent,
  UserNotification,
} from "@/shared/types/messaging";

export type DbSession = { token: string; userId: string; issuedAt: number };

export type Db = {
  products: Product[];
  categories: Category[];
  orders: Order[];
  users: User[];
  movements: InventoryMovement[];
  settings: BusinessSettings;
  posSales: PosSale[];
  threads: ChatThread[];
  messages: Record<string, Message[]>;
  notifications: UserNotification[];
  notificationPreferences: NotificationPreferences;
  realtimeEvents: RealtimeEvent[];
  /** email -> bcrypt-ish (plain in dev) */
  passwords: Record<string, string>;
  sessions: Map<string, DbSession>; // accessToken -> session
  refreshTokens: Map<string, string>; // refreshToken -> userId
};

const DEMO_PASSWORD = "password";

function seed(): Db {
  return {
    products: structuredClone(mockProducts),
    categories: structuredClone(mockCategories),
    orders: structuredClone(mockOrders),
    users: structuredClone(mockUsers),
    movements: structuredClone(mockMovements),
    settings: structuredClone(mockSettings),
    posSales: structuredClone(mockPosSales),
    threads: structuredClone(mockThreads),
    messages: structuredClone(mockMessages),
    notifications: [
      {
        id: "notification-1",
        type: "MESSAGE",
        title: "New customer message",
        body: "Is my order ready?",
        resourceType: "THREAD",
        resourceId: mockThreads[0]?.id ?? null,
        readAt: null,
        createdAt: new Date().toISOString(),
      },
    ],
    notificationPreferences: {
      messagesEnabled: true,
      ordersEnabled: true,
      paymentsEnabled: true,
    },
    realtimeEvents: [
      {
        id: "1",
        type: "NOTIFICATION_CREATED",
        resourceType: "NOTIFICATION",
        resourceId: "notification-1",
        data: { notificationType: "MESSAGE" },
        occurredAt: new Date().toISOString(),
      },
    ],
    passwords: Object.fromEntries(mockUsers.map((u) => [u.email, DEMO_PASSWORD])),
    sessions: new Map(),
    refreshTokens: new Map(),
  };
}

export let db: Db = seed();

export function resetDb() {
  db = seed();
}

export function randomId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function findUserByToken(token: string | null): User | null {
  if (!token) return null;
  const session = db.sessions.get(token);
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) ?? null;
}

export function tokenFromAuthHeader(header: string | null): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m ? m[1] : null;
}
