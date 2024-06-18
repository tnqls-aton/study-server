import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomDocument = Room & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'rooms',
})
export class Room {
  _id: Types.ObjectId;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User', required: true }],
  })
  master: Types.ObjectId[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: [],
  })
  users: Types.ObjectId[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
