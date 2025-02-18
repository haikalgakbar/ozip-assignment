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
  private redisClient = new Redis({ host: process.env.REDIS_HOST || "localhost", port: parseInt(process.env.REDIS_PORT || "5000") });
  private redisSubscriber = new Redis({ host: process.env.REDIS_HOST || "localhost", port: parseInt(process.env.REDIS_PORT || "5000") });

  constructor() {
    this.redisSubscriber.psubscribe("room:*");

    this.redisSubscriber.on("pmessage", (_, channel, message) => {
      console.log(`Received message on channel ${channel}: ${message}`);
      const parsedMessage = JSON.parse(message);

      this.server.to(channel).emit("newMessage", parsedMessage);
    });
  }

  private connectedUser: { id: string, name: string }[] = [];

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedUser = this.connectedUser.filter((user) => user.id !== client.id);
    this.broadcastUsers();
  }

  @SubscribeMessage("setUser")
  handleSetUser(client: Socket, data: { name: string }) {
    this.connectedUser.push({ id: client.id, name: data.name });
    this.broadcastUsers();
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, roomName: string) {
    const prefixedRoomName = `room:${roomName}`;
    console.log(`Client ${client.id} joined room ${prefixedRoomName}`);
    client.join(prefixedRoomName);

    const history = await this.redisClient.lrange(prefixedRoomName, 0, -1);
    const parsedHistory = history.map((msg) => JSON.parse(msg));
    client.emit('loadMessages', parsedHistory);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: {
    sender: { id: string, name: string, message: string },
    recepient: { id: string, name: string }
  }) {
    const sender = payload.sender;
    const recipient = payload.recepient;

    if (!sender || !recipient) {
      client.emit('error', 'Invalid recipient');
      return;
    }

    const roomName = [sender.id, recipient.id].sort().join('-');
    const prefixedRoomName = `room:${roomName}`;
    const message = {
      roomId: roomName,
      senderId: sender.id,
      senderName: sender.name,
      recipientId: recipient.id,
      recipientName: recipient.name,
      message: sender.message,
    };

    await this.redisClient.rpush(prefixedRoomName, JSON.stringify(message));
    await this.redisClient.publish(prefixedRoomName, JSON.stringify(message));
    console.log(`Published message to ${prefixedRoomName}:`, message);
  }

  private broadcastUsers() {
    this.server.emit("connectedUser", this.connectedUser);
  }
}