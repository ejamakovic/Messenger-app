import type { Page } from "../models/Page";
import type { UserModel } from "../models/user";
import { api } from "./api";

export const sendFriendRequest = async (
  requesterId: number | string,
  addresseeId: number | string
): Promise<void> => {
  await api.post('/friendships', null, {
    params: { requesterId, addresseeId },
  });
};

export const updateFriendshipStatus = async (
    friendshipId: number | string,
    status: string
): Promise<void> => {    
    await api.patch(`/friendships/${friendshipId}/status`, null, {
        params: { status }
    });
};

export const getFriends = async (
  id: number,
  page = 0,
  size = 10
): Promise<UserModel[]> => {
  const res = await api.get<Page<UserModel>>(`/friendships/user/${id}`, {
    params: { page, size },
  });

  return res.data.content;
};
