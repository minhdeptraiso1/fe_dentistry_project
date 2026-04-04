import { Client, type IFrame, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import type { NotificationPayload } from "@/types/notification";

type NotificationHandler = (payload: NotificationPayload) => void;

class NotificationSocketService {
  private client: Client | null = null;
  private currentUserId = "";

  connect(userId: string, onMessage: NotificationHandler) {
    if (!userId) return;

    if (this.client?.connected && this.currentUserId === userId) {
      return;
    }

    this.disconnect();

    const wsBase =
      import.meta.env.VITE_WS_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      window.location.origin;
    const wsPath = import.meta.env.VITE_WS_PATH || "/ws";
    const normalizedBase = String(wsBase).replace(/\/$/, "");
    const wsEndpoint = `${normalizedBase}${wsPath}`;

    this.currentUserId = userId;
    this.client = new Client({
      reconnectDelay: 5000,
      webSocketFactory: () => new SockJS(wsEndpoint),
      onConnect: () => {
        this.client?.subscribe(
          `/topic/notifications/${userId}`,
          (message: IMessage) => {
            try {
              const payload = JSON.parse(message.body || "{}");
              onMessage(payload);
            } catch {
              onMessage({
                userId,
                message: message.body || "Bạn có thông báo mới",
              });
            }
          },
        );
      },
      onStompError: (frame: IFrame) => {
        console.error("STOMP error:", frame.headers["message"], frame.body);
      },
      onWebSocketError: (event: Event) => {
        console.error("WebSocket error:", event);
      },
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.currentUserId = "";
  }
}

export const notificationSocketService = new NotificationSocketService();
