import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private redisClient: Redis;
  private redisSubscriber: Redis;
  private connectedUser: { id: string, name: string }[] = [];

  constructor(private configService: ConfigService) {
    const redisHost = this.configService.get<string>('REDIS_HOST') || 'redis-db';
    const redisPort = this.configService.get<number>('REDIS_PORT') || 6379;

    this.redisClient = new Redis({
      host: redisHost,
      port: redisPort,
    });
    this.redisSubscriber = new Redis({
      host: redisHost,
      port: redisPort,
    });

    this.redisSubscriber.psubscribe("*");
    this.redisSubscriber.on("pmessage", (_, channel, message) => {
      try {
        const parsedMessage = JSON.parse(message);
        this.server.to(channel).emit("newMessage", parsedMessage);
      } catch (err) {
        console.log(err)
      }
    });
  }

  handleConnection(client: Socket) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - Client disconnected: ${client.id}`);
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
    console.log(`Client ${client.id} joined room ${roomName}`);
    client.join(roomName);

    const history = await this.redisClient.lrange(roomName, 0, -1);
    const parsedHistory = history.map((msg) => JSON.parse(msg));
    client.emit('loadMessages', parsedHistory);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: {
    sender: { id: string, name: string, message: string },
    recepient: { id: string, name: string }
  }) {
    const sender = payload.sender;
    const recepient = payload.recepient;

    if (!sender || !recepient) {
      client.emit('error', 'Invalid recipient');
      return;
    }

    const roomName = [sender.id, recepient.id].sort().join('-');
    const message = {
      senderId: sender.id,
      senderName: sender.name,
      message: sender.message,
      timestamp: new Date().toISOString(),
    };

    await this.redisClient.rpush(roomName, JSON.stringify(message));
    await this.redisClient.publish(roomName, JSON.stringify(message));
  }

  private broadcastUsers() {
    this.server.emit("connectedUser", this.connectedUser);
  }
}