import { Client, type IFrame, type IMessage } from "@stomp/stompjs";
import { env } from "@/shared/config/env";
import { useAuthStore } from "@/app/stores/authStore";

type Handler = (msg: IMessage) => void;

class StompService {
  private client: Client | null = null;
  private subscriptions = new Map<string, Handler>();
  private hiddenTimer: ReturnType<typeof setTimeout> | null = null;
  private connected = false;
  private listeners: Array<(connected: boolean) => void> = [];

  connect() {
    if (this.client) return;
    const token = useAuthStore.getState().accessToken;
    this.client = new Client({
      brokerURL: env.VITE_WS_BASE_URL,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 1000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      onConnect: () => {
        this.connected = true;
        this.listeners.forEach((l) => l(true));
        for (const [dest, handler] of this.subscriptions) {
          this.client?.subscribe(dest, handler);
        }
      },
      onDisconnect: () => {
        this.connected = false;
        this.listeners.forEach((l) => l(false));
      },
      onStompError: (frame: IFrame) => {
        // eslint-disable-next-line no-console
        console.warn("[stomp] error", frame.headers["message"], frame.body);
      },
      // Tame backoff cap
      onWebSocketClose: () => {
        if (this.client && this.client.reconnectDelay < 30_000) {
          this.client.reconnectDelay = Math.min(this.client.reconnectDelay * 2, 30_000);
        }
      },
    });
    try {
      this.client.activate();
    } catch {
      /* noop: ws unavailable in dev */
    }
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  disconnect() {
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.client?.deactivate();
    this.client = null;
    this.connected = false;
  }

  subscribe(destination: string, handler: Handler) {
    this.subscriptions.set(destination, handler);
    if (this.connected) {
      this.client?.subscribe(destination, handler);
    }
    return () => {
      this.subscriptions.delete(destination);
    };
  }

  onStatus(listener: (connected: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  isConnected() {
    return this.connected;
  }

  private onVisibility = () => {
    if (document.hidden) {
      this.hiddenTimer = setTimeout(() => this.client?.deactivate(), 60_000);
    } else {
      if (this.hiddenTimer) clearTimeout(this.hiddenTimer);
      this.hiddenTimer = null;
      if (this.client && !this.connected) this.client.activate();
    }
  };
}

export const stomp = new StompService();
