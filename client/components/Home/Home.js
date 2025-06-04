import { useEffect, useState, useCallback } from "react";
import { useFocusEffect, useRoute } from '@react-navigation/native';
import Styles from './Style';
import { useNavigation } from "@react-navigation/native";
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { endpoints } from "../../configs/Apis";
import axiosInstance from "../../configs/AxiosInterceptor";
import Icon from 'react-native-vector-icons/FontAwesome';


const Home = () => {
    const nav = useNavigation();
    const route = useRoute();
    const [avatar, setAvatar] = useState("https://res.cloudinary.com/dywyrpfw7/image/upload/v1744530660/a22aahwkjiwomfmvvmaj.png");

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);


    const loadNotifications = useCallback(async () => {
        if (loading || !hasMore) return;
        setLoading(true);

        try {
            const res = await axiosInstance.get(`${endpoints.notifications}?page=${page}`);
            // console.log("Response data:", res.data);

            if (res.data && res.data.results) {
                const newNotifications = res.data.results
                    .map(item => ({
                        id: item.id,
                        title: item.notification.title,
                        content: item.notification.content,
                        icon: item.notification.notification_type,
                        created_at: item.created_at,
                        is_read: item.is_read,
                    }));

                setNotifications(prev => [...newNotifications, ...prev]);
                setHasMore(res.data.next !== null);
                setPage(prev => prev + 1);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Lỗi khi tải thông báo:", error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    useFocusEffect(
        useCallback(() => {
            if (route.params?.newAvatar) {
                setAvatar(route.params.newAvatar);
                // Xóa param sau khi lấy để tránh set lại nhiều lần
                nav.setParams({ newAvatar: undefined });
            }
        }, [route.params?.newAvatar])
    );

    // Hàm xử lý cuộn để tải thêm thông báo
    const handleScroll = ({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
        if (isCloseToBottom && hasMore && !loading) {
            loadNotifications(); // Gọi hàm tải thêm khi cuộn gần cuối
        }
    };


    const handlePress = async (notificationId) => {
        markNotificationRead(notificationId);

        // Cập nhật UI nhanh
        setNotifications((prev) =>
            prev.map((n) =>
                n.id === notificationId ? { ...n, is_read: true } : n
            )
        );

        nav.navigate("homenotification", { notificationId });
    };


    const markNotificationRead = async (notificationId) => {
        try {
            await axiosInstance.post(endpoints.markRead, { notification_id: notificationId });
        } catch (err) {
            // Nếu backend lỗi, rollback UI
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, is_read: false } : n
                )
            );
            console.error(err);
        }
    };

    return (
        <View style={Styles.container}>
            <View style={Styles.header}>
                <Image
                    source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1744443009/fqc9yrpspqnkvwlk2zek.png" }}
                    style={Styles.logo}
                />
                <Text style={Styles.slogan}>Your experience is our experience too</Text>
            </View>

            <View style={Styles.searchBar}>
                <TouchableOpacity onPress={() => nav.navigate("homepersonal")}>
                    <Image
                        source={{ uri: avatar }}
                        style={Styles.avatar}
                    />
                </TouchableOpacity>
                <View style={Styles.rightIcons}>
                    <TouchableOpacity onPress={() => nav.navigate("homeqr")}>
                        <Image
                            source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1744536313/jzzudtnakfmkygcfdaw1.png" }}
                            style={Styles.imgIcon}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => nav.navigate("homechat")}>
                        <Image
                            source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1744536313/h8ur4we2qjw5fss9s4la.png" }}
                            style={Styles.imgIcon}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={Styles.titleContainer}>
                <Text style={Styles.title}>THÔNG BÁO</Text>
            </View>

            <ScrollView
                contentContainerStyle={[Styles.notifications, { paddingBottom: 140 }]}
                onScroll={handleScroll}
                scrollEventThrottle={400}
            >
                {notifications.map((item, index) => (
                    <TouchableOpacity
                        key={item.id || index}
                        onPress={() => handlePress(item.id)}
                    >
                        <View style={Styles.notificationItem}>
                            <Icon
                                name={item.icon === "URGENT" ? "exclamation-triangle" : "bell"}
                                size={22}
                                color={item.is_read ? "#999" : (item.icon === "URGENT" ? "#d9534f" : "#f0ad4e")}
                                style={{ marginRight: 10 }}
                            />
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[
                                        Styles.notificationText,
                                        item.is_read && { color: "#999" }
                                    ]}
                                >
                                    {item.title}
                                </Text>
                                <Text
                                    style={[
                                        Styles.notificationTime,
                                        item.is_read && { color: "#aaa" }
                                    ]}
                                >
                                    {new Date(item.created_at).toLocaleString("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                {loading && <ActivityIndicator size="large" color="#0000ff" />}
            </ScrollView>
        </View>
    );
};

export default Home;
