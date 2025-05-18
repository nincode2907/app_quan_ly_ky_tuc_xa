import axios from "axios";

const BASE_URL = 'https://2f06-14-186-218-230.ngrok-free.app';

export const endpoints = {
    'login': '/o/token/',
    'user_me': '/api/user/me/',
    'students': '/api/students/',
    'studentInfo': '/api/students/me/',
    'updateProfile': '/api/students/update-profile/',
    'changePassword': '/api/user/change_password/',
    'requestOtp': '/api/request-otp/',
    'verifyOtp': '/api/verify-otp/',
    'notifications': '/api/notifications/',
    'markReadNotifications': '/api/notifications/mark-read/',

    'rooms': '/api/rooms/',
    'roomRequest': '/api/students/room-request/',
    'roomStatus': '/api/room-requests/',
};

export const authApis = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};

export default axios.create({
    baseURL: BASE_URL,
});
