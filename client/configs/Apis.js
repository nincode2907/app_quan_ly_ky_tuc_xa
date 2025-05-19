    import axios from "axios";

    const BASE_URL = 'https://ninpy.pythonanywhere.com';

    export const endpoints = {
        'login': '/o/token/',
        'requestOtp': '/api/request-otp/',
        'verifyOtp': '/api/verify-otp/',

        'user_me': '/api/user/me/',
        'students': '/api/students/',
        'studentInfo': '/api/students/me/',
        'updateProfile': '/api/students/update-profile/',
        'changePassword': '/api/user/change_password/',
        'notifications': '/api/notifications/',
        'markReadNotifications': '/api/notifications/mark-read/',

        'rooms': '/api/rooms/',
        'roomsFavorites': '/api/rooms/favorites/',
        'toggleFavorite': '/api/rooms/toggle-favorite/',
        'roomRequest': '/api/students/room-request/',
        'roomStatus': '/api/room-requests/',

        'bills': '/api/bills/',
        'paymentTransactions': '/api/payment-transactions/',
        'paymenMethods/': '/api/payment-methods/',
        'initiatePayment': '/api/payment/initiate-payment/',
        'supportRequest': '/api/support-requests/',

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
