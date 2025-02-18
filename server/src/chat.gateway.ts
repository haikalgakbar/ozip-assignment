import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private redisClient = new Redis({
    host: "localhost",
    port: 6379
  });
  private connectedUser: {
    id: string,
    name: string,
  }[] = [];

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
  async handleJoinRoom(client: Socket, roomName: string) {
    client.join(roomName);

    const history = await this.redisClient.lrange(roomName, 0, -1)
    const parsedHistory = history.map((msg) => JSON.parse(msg))

    client.emit('loadMessages', parsedHistory);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: {
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

    const message = {
      roomId: roomName,
      senderId: sender.id,
      senderName: sender.name,
      recipientId: recipient.id,
      recipientName: recipient.name,
      message: sender.message,
    }

    await this.redisClient.rpush(roomName, JSON.stringify(message))

    await this.redisClient.publish(roomName, JSON.stringify(message))

    client.to(roomName).emit('newMessage', message);
    client.emit('newMessage', message);
  }

  private broadcastUsers() {
    this.server.emit("connectedUser", this.connectedUser)
  }
}