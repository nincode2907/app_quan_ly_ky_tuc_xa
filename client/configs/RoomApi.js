import { authApis, endpoints } from './Apis';

export const toggleFavoriteRoom = async (roomId, token) => {
  try {
    const res = await authApis(token).post(endpoints.toggleFavorite, { room_id: roomId });
    return res.data;
  } catch (error) {
    console.error("Toggle favorite error:", error);
    throw error;
  }
};

export const getFavoriteRooms = async (token) => {
  try {
    const res = await authApis(token).get(endpoints.roomsFavorites);
    return res.data;
  } catch (error) {
    console.error("Get favorite rooms error:", error);
    throw error;
  }
};
