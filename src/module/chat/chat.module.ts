import { Module, Provider, forwardRef } from '@nestjs/common';
import { ChatController } from './controller/chat.controller';
import { ChatService } from './service/chat.service';
import { ChatRepositoryImplement } from './repository/chat.repository.implement';
import { Message, MessageSchema } from './schema/message.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './gateway/chat.gateway';
import { RoomModule } from '../room/room.module';
import { CacheModule } from 'src/lib/cache.module';
import { UserModule } from '../user/user.module';

const infrastructure: Provider[] = [
  {
    provide: 'CHAT_REPOSITORY',
    useClass: ChatRepositoryImplement,
  },
];

const services = [ChatService, ChatGateway];

const controller = [ChatController];

@Module({
  imports: [
    forwardRef(() => RoomModule),
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    CacheModule,
    UserModule,
  ],
  controllers: [...controller],
  providers: [...services, ...infrastructure],
  exports: [...services],
})
export class ChatModule {}
