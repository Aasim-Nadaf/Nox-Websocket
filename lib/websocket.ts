import { WS_URL } from './api';

class WebSocketManager {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private url = WS_URL;

  /**
   * Global handler — used by the Zustand store to update chatsList / typingUsers.
   */
  public onMessageHandler: ((message: any) => void) | null = null;

  /**
   * Chat-screen-specific handler — registered by the active ChatScreen to receive
   * new_message / new_group_message events for display.
   */
  public onChatMessageHandler: ((message: any) => void) | null = null;

  connect(userId: string) {
    if (this.ws) {
      this.disconnect();
    }

    this.userId = userId;
    this.ws = new WebSocket(`${this.url}?userId=${userId}`);

    this.ws.onopen = () => {
      console.log('[WS] Connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Dispatch to global store handler
        if (this.onMessageHandler) {
          this.onMessageHandler(data);
        }
        // Also dispatch to active chat screen handler if registered
        if (this.onChatMessageHandler) {
          this.onChatMessageHandler(data);
        }
      } catch (e) {
        console.error('[WS] Parse error', e);
      }
    };

    this.ws.onerror = (e) => {
      console.error('[WS] Error', e);
    };

    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      // Reconnect after 5s
      setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId);
        }
      }, 5000);
    };
  }

  sendMessage(receiverId: string, content: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.userId) {
      this.ws.send(
        JSON.stringify({
          type: 'message',
          senderId: this.userId,
          receiverId,
          content,
        })
      );
    } else {
      console.error('[WS] Not ready to send');
    }
  }

  sendGroupMessage(groupId: string, content: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.userId) {
      this.ws.send(
        JSON.stringify({
          type: 'group_message',
          senderId: this.userId,
          groupId,
          content,
        })
      );
    }
  }

  sendTypingStatus(receiverId: string, isTyping: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.userId) {
      this.ws.send(
        JSON.stringify({
          type: isTyping ? 'typing' : 'stop_typing',
          senderId: this.userId,
          receiverId,
        })
      );
    }
  }

  sendMessageRead(messageIds: string[], readerId: string, senderId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.userId) {
      this.ws.send(
        JSON.stringify({
          type: 'message_read',
          messageIds,
          readerId,
          senderId,
        })
      );
    }
  }

  disconnect() {
    this.userId = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get currentUserId() {
    return this.userId;
  }
}

export const wsManager = new WebSocketManager();
