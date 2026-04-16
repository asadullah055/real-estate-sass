import type { IUser } from './users.model.js';

export interface UserProfileDto {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  avatarUrl?: string;
  createdAt: string;
}

export function toUserProfileDto(user: IUser): UserProfileDto {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}
