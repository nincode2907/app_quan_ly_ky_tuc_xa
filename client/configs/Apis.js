import axios from "axios";
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
    'checkinoutLogs': '/api/checkinout-logs/scan/',
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

    'issueReport': '/api/issue-reports/',
    'surveys': '/api/surveys/',
    'surveyResponses': '/api/survey-responses/',
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
