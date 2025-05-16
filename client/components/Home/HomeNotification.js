import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useRoute } from "@react-navigation/native";
import StyleNotification from "./StyleNotification";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeNotification = () => {
    const route = useRoute();
    const { notificationId } = route.params;
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);


    const loadNotification = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            console.log("Token:", token);
            console.log("Notification ID:", notificationId);
            console.log("URL gọi API:", `${endpoints.notifications}${notificationId}/`);
            const response = await authApis(token).get(`${endpoints.notifications}${notificationId}/`); // Gọi API lấy thông báo theo ID
            const data = response.data;

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
                <Text style={StyleNotification.notificationIntroText}>{notification.content}</Text>
            </View>

            <View style={StyleNotification.content}>
                <Text style={StyleNotification.chapter}>Chương II{"\n"}QUY ĐỊNH CỤ THỂ</Text>

                {/* <Text style={StyleNotification.article}>
                    Điều 3. Quy định về giờ giấc{"\n"}
                    {"\n"}1. Giờ mở, đóng cửa: giờ mở cửa: 05:00, giờ đóng cửa: 23:00. Sinh viên có nhu cầu ra, vào
                    KTX ngoài giờ quy định, phải thực hiện đăng ký trên hệ thống và minh chứng cụ thể.{"\n"}
                    {"\n"}a) Khách đến liên hệ công tác phải chịu sự kiểm soát, hướng dẫn của lực lượng bảo vệ và
                    phải chấp hành nội quy ra vào KTX.{"\n"}
                    b) Sinh viên khi ra vào cổng phải thông qua hệ thống kiểm soát an ninh, không gây ồn ào, không chen lấn, quét mã thẻ UEH Student/FaceID, xuất trình thẻ trên ứng dụng UEH Student khi có yêu cầu kiểm tra. Không cho mượn thẻ sinh viên để sử dụng thẻ không đúng. Tự trông giữ thẻ cục, phải khai báo mất thẻ với Quản lý sinh viên, Bảo vệ để xem xét giải quyết.{"\n"}
                    c) Sinh viên có nhu cầu qua đêm ở ngoài KTX vui lòng đăng ký trên hệ thống và báo cho Trưởng phòng.{"\n"}
                    {"\n"}2. Giờ tắt đèn trong phòng: 23:30 hàng ngày. Sinh viên nội trú chỉ được sử dụng thẻ cá nhân để học tập. Nghiêm cấm sinh viên nội trú gây ồn ào, bật tivi, mở livestream, mở nhạc, chơi game... Đội sinh viên tự quản có thể thông báo để nhắc nhở các Phòng vi phạm nội quy tắt đèn.
                </Text> */}
            </View>
        </ScrollView>
    );
};

export default HomeNotification;
