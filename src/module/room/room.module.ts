import { Module, Provider, forwardRef } from '@nestjs/common';
import { RoomController } from './controller/room.controller';
import { RoomService } from './service/room.service';
import { RoomRepositoryImplement } from './repository/room.repository.implement';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from './schema/room.schema';
import { ChatModule } from '../chat/chat.module';

const infrastructure: Provider[] = [
  {
    provide: 'ROOM_REPOSITORY',
    useClass: RoomRepositoryImplement,
  },
];

const services = [RoomService];

const controller = [RoomController];

@Module({
  imports: [
    forwardRef(() => ChatModule),
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  controllers: [...controller],
  providers: [...services, ...infrastructure],
  exports: [...services],
})
export class RoomModule {}
