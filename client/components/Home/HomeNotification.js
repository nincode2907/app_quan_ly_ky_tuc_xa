import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useRoute } from "@react-navigation/native";
import StyleNotification from "./StyleNotification";
import { endpoints } from "../../configs/Apis";
import axiosInstance from "../../configs/AxiosInterceptor";
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

const HomeNotification = () => {
    const route = useRoute();
    const { notificationId } = route.params;
    const { width } = useWindowDimensions();

    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);

    const loadNotification = async () => {
        try {
            const res = await axiosInstance.get(`${endpoints.notifications}${notificationId}/`);
            const data = res.data.notification;

            setNotification({
                icon: data.notification_type,
                content: data.content,
                title: data.title,
                created_at: data.created_at
            });
        } catch (error) {
            console.error("Error loading notification:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotification();
    }, [notificationId]);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    if (!notification) {
        return <Text>No notification found</Text>;
    }

    return (
        <ScrollView style={StyleNotification.container}>
            <View style={StyleNotification.notificationIntro}>
                <Text style={StyleNotification.notificationIcon}>
                    {notification.icon === "URGENT" ? "⚠️" : "🔔"}
                </Text>
                <Text style={StyleNotification.notificationIntroText}>{notification.title}</Text>
            </View>

            <View style={StyleNotification.content}>
                <RenderHtml contentWidth={width} source={{ html: notification.content }} />
            </View>
        </ScrollView>
    );
};

export default HomeNotification;
