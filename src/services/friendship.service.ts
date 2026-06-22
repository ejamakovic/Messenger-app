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
