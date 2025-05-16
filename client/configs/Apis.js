import axios from "axios";

const BASE_URL = 'https://ea67-14-186-218-230.ngrok-free.app';

export const endpoints = {
    'login': '/o/token/',
    'changePassword': '/api/user/change_password/',
    'notifications': '/api/notifications/',
    'markReadNotifications': '/api/notifications/mark-read/',

    'rooms': '/api/rooms/',
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
