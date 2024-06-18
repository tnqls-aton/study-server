import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayInit,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../service/chat.service';
import { CACHE_GENERATOR } from 'src/lib/cache.module';
import { RoomService } from 'src/module/room/service/room.service';
import { UserRepository } from 'src/module/user/interface/user.repository';

export enum Action {
  CONNECT = 'CONNECT',
  JOIN = 'JOIN',
  LEAVE = 'LEAVE',
  DISCONNECT = 'DISCONNECT',
  SEND_MESSAGE = 'SEND_MESSAGE',
  REFRESH_ROOM = 'REFRESH_ROOM',
}

export interface ConnectAction {
  _id: string;
}

export interface JoinRoomAction {
  room: string;
  user: string;
}

export interface LeaveRoomAction {
  room: string;
  user: string;
  name: string;
}

export interface SendMessageAction {
  room: string;
  user: string;
  name: string;
  content: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket'],
  namespace: /\/ws-.+/,
  allowEIO3: true,
})
@Injectable()
export class ChatGateway
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  constructor(
    private readonly chatService: ChatService,
    private readonly roomService: RoomService,
    @Inject('USER_REPOSITORY')
    private readonly userRepository: UserRepository,
    @Inject(CACHE_GENERATOR) private readonly cacheGenerator: CACHE_GENERATOR,
  ) {}
  private logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log(`Socket Server Init Complete`);
  }

  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    client.emit('connect-message', `${client.id}`);
    this.logger.log(`${client.id}가 연결되었습니다`);
  }

  //소켓 끊어졌을때
  async handleDisconnect(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      const _id = (await this.cacheGenerator.getCache(
        `SOCKET:${client.id}`,
      )) as string;
      await this.cacheGenerator.delCache(`SOCKET:${client.id}`);
      const room = await this.roomService.findMyRoom(_id);
      if (room) {
        const room_id = String(room._id);
        const disconnect_data = {
          type: Action.DISCONNECT,
          socket: client.id,
          master: room.master[0],
          room: room_id,
          user: _id,
        };
        this.server.to(room_id).emit('receive-message', disconnect_data);
        await this.roomService.leave(room_id, _id);
        this.logger.log(`${client.id}님이 연결이 끊겼습니다`);
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  //소켓 유저 아이디 매칭
  @SubscribeMessage('connecting')
  async connectEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ConnectAction,
  ): Promise<void> {
    try {
      const connect_data = {
        type: Action.CONNECT,
        socket: client.id,
        _id: data._id,
      };
      await this.cacheGenerator.setCache(`SOCKET:${client.id}`, data._id, 0);
      client.emit('receive-message', connect_data);

      this.logger.log(`SOCKET:${client.id} Connect`);
    } catch (e) {
      this.logger.error(e);
    }
  }

  //방 참여하기
  @SubscribeMessage('join-room')
  async joinRoomEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomAction,
  ): Promise<void> {
    client.join(data.room);
    const user = await this.userRepository.findById(data.user);
    await this.roomService.join(data.room, data.user);
    const join_data = {
      type: Action.JOIN,
      room: data.room,
      name: String(user.name),
      user: String(user._id),
    };

    this.server.to(data.room).emit('receive-message', join_data);
    this.logger.log(`${client.id}님이 ${data.room} 방에 입장 했습니다.`);
  }

  //방 나가기
  @SubscribeMessage('leave-room')
  async leaveRoomEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LeaveRoomAction,
  ): Promise<void> {
    try {
      const room = await this.roomService.leave(data.room, data.user);
      const leave_data = {
        type: Action.LEAVE,
        room: data.room,
        user: data.user,
        name: data.name,
        master: room.master[0]._id,
        socket: client.id,
      };
      this.server.to(data.room).emit('receive-message', leave_data);
      this.logger.log(`${client.id}님이 ${data.room} 방에 퇴장 했습니다.`);
    } catch (e) {
      this.logger.error(e);
    }
  }

  //채팅방 메세지 보내기
  @SubscribeMessage('send-message')
  async sendMessageEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageAction,
  ): Promise<void> {
    try {
      const message_data = {
        type: Action.SEND_MESSAGE,
        room: data.room,
        user: data.user,
        name: data.name,
        socket: client.id,
        content: data.content,
      };

      this.server.to(data.room).emit('receive-message', message_data);
      this.chatService.mqttMessageSend(data);
      this.logger.debug(`${data.content}`);
    } catch (e) {
      this.logger.error(e);
    }
  }

  //로비 리프레시
  @SubscribeMessage('refresh-message')
  async refreshMessageEvent(): Promise<void> {
    const message_data = {
      type: Action.REFRESH_ROOM,
    };
    this.server.emit('receive-message', message_data);
  }
}
