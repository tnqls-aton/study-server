import { CreateUserRequestDto } from '../dto/create-user.request.dto';
import { User } from '../schema/user.schema';

export interface UserRepository {
  insert(body: CreateUserRequestDto): Promise<User>;
  findAll(): Promise<User[]>;
  findById(_id: string): Promise<User>;
  findByUserId(user_id: string): Promise<User>;
  //   delete(entity: UserEntity): Promise<boolean>;
  //   findOneById(id: string): Promise<Option<UserEntity>>;
}
