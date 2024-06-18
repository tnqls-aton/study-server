import { Injectable } from '@nestjs/common';
import { Room, RoomDocument } from '../schema/room.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RoomRepository } from '../interface/room.repository';
import { CreateRoomRequestDto } from '../dto/create-room.request.dto';
import { UserDto } from 'src/module/user/dto/user.dto';

@Injectable()
export class RoomRepositoryImplement implements RoomRepository {
  constructor(@InjectModel(Room.name) private roomModel: Model<RoomDocument>) {}

  create(user: UserDto, body: CreateRoomRequestDto): Promise<Room> {
    const { title } = body;
    const { _id } = user;
    const created_room = new this.roomModel({
      title,
      master: new Types.ObjectId(_id),
    });
    return created_room.save();
  }

  findAll(): Promise<Room[]> {
    return this.roomModel
      .find()
      .populate({ path: 'users', model: 'User' })
      .populate({ path: 'master', model: 'User' })
      .exec();
  }

  findById(_id: string): Promise<Room> {
    return this.roomModel
      .findById(new Types.ObjectId(_id))
      .populate({ path: 'users', model: 'User' })
      .populate({ path: 'master', model: 'User' })
      .exec();
  }

  join(_id: string, user_id: string): Promise<Room> {
    return this.roomModel
      .findByIdAndUpdate(
        new Types.ObjectId(_id),
        { $push: { users: new Types.ObjectId(user_id) } },
        { new: true },
      )
      .populate({ path: 'users', model: 'User' })
      .populate({ path: 'master', model: 'User' })
      .exec();
  }

  leave(_id: string, user_id: string): Promise<Room> {
    return this.roomModel
      .findByIdAndUpdate(
        new Types.ObjectId(_id),
        { $pull: { users: new Types.ObjectId(user_id) } },
        { new: true },
      )
      .populate({ path: 'users', model: 'User' })
      .populate({ path: 'master', model: 'User' })
      .exec();
  }

  delete(_id: string): Promise<Room> {
    return this.roomModel.findByIdAndDelete(new Types.ObjectId(_id)).exec();
  }

  findMyRoom(_id: string): Promise<Room> {
    return this.roomModel
      .findOne({
        users: [new Types.ObjectId(_id)],
      })
      .exec();
  }
}
