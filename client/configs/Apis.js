import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "@env";


export const endpoints = {
    'login': '/o/token/',
    'requestOtp': '/api/request-otp/',
    'verifyOtp': '/api/verify-otp/',
    'resetPassword': '/api/user/reset-password/',

    'user_me': '/api/user/me/',
    'students': '/api/students/',
    'studentInfo': '/api/students/me/',
    'updateProfile': '/api/students/update-profile/',
    'changePassword': '/api/user/change_password/',
    'notifications': '/api/notifications/',
    'markRead': "/api/notifications/mark-read/",

    'rooms': '/api/rooms/',
    'roomsFavorites': '/api/rooms/favorites/',
    'toggleFavorite': '/api/rooms/toggle-favorite/',
    'roomRequest': '/api/students/room-request/',
    'roomStatus': '/api/room-requests/',

    'bills': '/api/bills/',
    'paymentTransactions': '/api/payment-transactions/',
    'paymentMethods': '/api/payment-methods/',
    'initiatePayment': '/api/payment/initiate-payment/',
    'supportRequest': '/api/support-requests/',

    'conversations': '/api/conversations/',
    'messages': '/api/messages/',

};

export const authApis = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};


// export const refreshToken = async () => {
//     try {
//         const refresh_token = await AsyncStorage.getItem("refreshToken");
//         if (!refresh_token) {
//             throw new Error("Không tìm thấy refresh token");
//         }

//         const params = new URLSearchParams();
//         params.append('grant_type', 'refresh_token');
//         params.append('refresh_token', refresh_token);
//         params.append('client_id', 'Cu3HL1ySqXavkOfzvqfAE827cPS25M0LnZMEtnfM');
//         params.append('client_secret', 'Uye8Hr3izkQ7JGgRTBW65XVq3sVX68jVqonIpkiQaive5AQFUKQlz12mTUz8EQt9RzealMnkzTbgPW8RZScWHVxWlNBqyrgZp0CRY5mJOb1YWkWeLvtXalBXnHVrDAKt');

//         const res = await axios.post(`${BASE_URL}/o/token/`, params.toString(), {
//             headers: { 'Content-Type': 'application/json' }
//         });

//         const { access_token, refresh_token: newRefreshToken } = res.data;

//         await AsyncStorage.setItem("token", access_token);

//         if (newRefreshToken) {
//             await AsyncStorage.setItem("refreshToken", newRefreshToken);
//         }

//         return access_token;
//     } catch (error) {
//         console.error("Lỗi khi refresh token:", error);
//         throw error;
//     }
// };

export default axios.create({
    baseURL: BASE_URL,
});
