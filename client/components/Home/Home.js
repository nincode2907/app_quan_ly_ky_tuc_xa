import { useEffect, useState, useCallback } from "react";
import Styles from './Style';
import { useNavigation } from "@react-navigation/native";
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Home = () => {
    const nav = useNavigation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);


    const fetchNotifications = useCallback(async () => {
        if (loading || !hasMore) return;
        setLoading(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(`${endpoints.notifications}?page=${page}`);

            if (res.data && res.data.results) {
                const newNotifications = res.data.results.map(item => ({
                    id: item.id,
                    title: item.notification.title,
                    content: item.notification.content,
                    icon: item.notification.notification_type,
                    created_at: item.created_at,
                }));

                setNotifications(prev => [...prev, ...newNotifications]);
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
        fetchNotifications(); 
    }, [fetchNotifications]);

    // Hàm xử lý cuộn để tải thêm thông báo
    const handleScroll = ({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
        if (isCloseToBottom && hasMore && !loading) {
            fetchNotifications(); // Gọi hàm tải thêm khi cuộn gần cuối
        }
    };


    const handlePress = (notificationId) => {
        nav.navigate('homenotification', { notificationId }); 
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
                        source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1744530660/a22aahwkjiwomfmvvmaj.png" }}
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
                            <View style={Styles.notificationItem}>
                                <Text style={Styles.notificationIcon}>
                                    {item.icon === "URGENT" ? "⚠️" : "🔔"} 
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={Styles.notificationText}>{item.title}</Text>
                                <Text style={Styles.notificationTime}>
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
