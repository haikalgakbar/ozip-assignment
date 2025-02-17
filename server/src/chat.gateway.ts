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

  private users: {
    id: string,
    userName: string,
    displayName: string
  }[] = []

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit("welcome", `Hello, your user ID is: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.users = this.users.filter((user) => user.id !== client.id);
    this.broadcastUsers();
  }

  @SubscribeMessage("setUser")
  handleSetUser(client: Socket, data: {
    userName: string,
    displayName: string
  }) {
    const existingUser = this.users.find((user) => user.userName === data.userName)

    if (existingUser) {
      client.emit("login_status", { status: false, msg: "User already exist" });
      return
    }

    this.users.push({ id: client.id, userName: data.userName, displayName: data.displayName });
    this.broadcastUsers();
  }

  private broadcastUsers() {
    const userList = this.users.map((user) => user.userName);
    this.server.emit('updateUsers', this.users); // Broadcast the updated user list
  }
}