import { authApis, endpoints } from './Apis';
import axiosInstance from "./AxiosInterceptor";

export const toggleFavoriteRoom = async (roomId) => {
  try {
    const res = await axiosInstance.post(endpoints.toggleFavorite, { room_id: roomId });
    const data = res.data;

    if (data?.is_favorite === undefined) {
      throw new Error("Phản hồi không hợp lệ từ server");
    }

    return data;
  } catch (error) {
    console.error("Toggle favorite error:", error.response?.data || error.message);
    throw error;
  }
};


export const getFavoriteRooms = async () => {
  try {
    const res = await axiosInstance.get(endpoints.roomsFavorites);
    return res.data;
  } catch (error) {
    console.error("Get favorite rooms error:", error);
    throw error;
  }
};

