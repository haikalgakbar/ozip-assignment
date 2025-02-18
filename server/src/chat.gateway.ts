import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUser: {
    id: string,
    name: string,
  }[] = []

  private messageHistory: Map<string, {
    roomId: string,
    senderId: string,
    senderName: string,
    recipientId: string,
    recipientName: string
    message: string
  }[]> = new Map()

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedUser = this.connectedUser.filter((user) => user.id !== client.id);
    this.broadcastUsers();
  }

  @SubscribeMessage("setUser")
  handleSetUser(client: Socket, data: {
    name: string
  }) {
    this.connectedUser.push({ id: client.id, name: data.name });
    this.broadcastUsers();
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, roomName: string) {
    client.join(roomName);

    const history = this.messageHistory.get(roomName) || [];
    client.emit('loadMessages', history);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(client: Socket, payload: {
    sender: {
      id: string,
      name: string,
      message: string
    }, recepient: {
      id: string,
      name: string,
    }
  }) {
    const sender = payload.sender;
    const recipient = payload.recepient;

    if (!sender || !recipient) {
      client.emit('error', 'Invalid recipient');
      return;
    }

    const roomName = [sender.id, recipient.id].sort().join('-');

    if (!this.messageHistory.has(roomName)) {
      this.messageHistory.set(roomName, []);
    }

    const message = {
      roomId: roomName,
      senderId: sender.id,
      senderName: sender.name,
      recipientId: recipient.id,
      recipientName: recipient.name,
      message: sender.message,
    }

    const roomMessages = this.messageHistory.get(roomName);
    if (roomMessages) {
      roomMessages.push(message);
    }

    client.to(roomName).emit('newMessage', message);
    client.emit('newMessage', message);
  }

  private broadcastUsers() {
    this.server.emit("connectedUser", this.connectedUser)
  }
}