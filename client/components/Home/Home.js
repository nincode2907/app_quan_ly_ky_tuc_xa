import { useEffect, useState, useCallback, useRef } from "react";
import { useFocusEffect, useRoute } from '@react-navigation/native';
import Styles from './Style';
import { useNavigation } from "@react-navigation/native";
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { endpoints } from "../../configs/Apis";
import axiosInstance from "../../configs/AxiosInterceptor";
import Icon from 'react-native-vector-icons/FontAwesome';
import { useWebSocket } from '../../contexts/WebSocketContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from '@env';



const Home = () => {
    const nav = useNavigation();
    const route = useRoute();
    const [avatar, setAvatar] = useState("https://res.cloudinary.com/dywyrpfw7/image/upload/v1744530660/a22aahwkjiwomfmvvmaj.png");
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const { unreadMessages, setUnreadMessages } = useWebSocket();
    const wsRef = useRef(null);

    const loadNotifications = useCallback(async () => {
        if (loading || !hasMore) return;
        setLoading(true);

        try {
            const res = await axiosInstance.get(`${endpoints.notifications}?page=${page}`);
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
        initWebSocket(); 
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [loadNotifications]);

    useFocusEffect(
        useCallback(() => {
            if (route.params?.newAvatar) {
                setAvatar(route.params.newAvatar);
                nav.setParams({ newAvatar: undefined });
            }
        }, [route.params?.newAvatar])
    );

    const handleScroll = ({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
        if (isCloseToBottom && hasMore && !loading) {
            loadNotifications();
        }
    };

    const handlePress = async (notificationId) => {
        markNotificationRead(notificationId);
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        nav.navigate("homenotification", { notificationId });
    };

    const markNotificationRead = async (notificationId) => {
        try {
            await axiosInstance.post(endpoints.markRead, { notification_id: notificationId });
        } catch (err) {
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: false } : n)
            );
            console.error(err);
        }
    };

    const initWebSocket = useCallback(async () => {
        try {
            const accessToken = await AsyncStorage.getItem('token');
            if (!accessToken) return;

            const protocol = BASE_URL.startsWith('https') ? 'wss' : 'ws';
            const host = BASE_URL.replace(/https?:\/\//, '');
            const wsUrl = `${protocol}://${host}/ws/chat/?token=${accessToken}`;

            const socket = new WebSocket(wsUrl);
            wsRef.current = socket;

            socket.onopen = () => {
                console.log('WebSocket connected');
            };

            socket.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.message) {
                        setUnreadMessages(prev => prev + 1);
                    }
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            };

            socket.onclose = () => {
                console.log('WebSocket closed');
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Error initializing WebSocket:', error);
        }
    }, []);

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

                    <TouchableOpacity onPress={() => {
                        nav.navigate("homechat");
                        setUnreadMessages(0);
                    }}>
                        <View style={{ position: 'relative' }}>
                            <Image
                                source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1744536313/h8ur4we2qjw5fss9s4la.png" }}
                                style={Styles.imgIcon}
                            />
                            {unreadMessages > 0 && (
                                <View style={{
                                    position: 'absolute',
                                    top: -5,
                                    right: -5,
                                    backgroundColor: 'red',
                                    borderRadius: 10,
                                    width: 10,
                                    height: 10,
                                }} />
                            )}
                        </View>
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