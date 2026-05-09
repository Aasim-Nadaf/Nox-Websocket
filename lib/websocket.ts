import { WS_URL } from './api';

class WebSocketManager {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private url = WS_URL;
  public onMessageHandler: ((message: any) => void) | null = null;

  connect(userId: string) {
    if (this.ws) {
      this.disconnect();
    }

    this.userId = userId;
    this.ws = new WebSocket(`${this.url}?userId=${userId}`);

    this.ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onMessageHandler) {
          this.onMessageHandler(data);
        }
      } catch (e) {
        console.error('WebSocket parse error', e);
      }
    };

    this.ws.onerror = (e) => {
      console.error('WebSocket Error', e);
    };

    this.ws.onclose = () => {
      console.log('WebSocket Disconnected');
      // basic reconnect logic
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
      console.error('WebSocket not ready to send');
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
}

export const wsManager = new WebSocketManager();
