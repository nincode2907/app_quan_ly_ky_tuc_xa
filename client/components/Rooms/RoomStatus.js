import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { Chip } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from "../../configs/AxiosInterceptor";
import { endpoints } from "../../configs/Apis";
import styles from './StyleRoomsStatus';

const statusLabels = {
    PENDING: "Đang chờ",
    APPROVED: "Được duyệt",
    REJECTED: "Bị từ chối",
};

const RoomStatus = () => {
    const nav = useNavigation();
    const [selectedStatus, setSelectedStatus] = useState("PENDING");
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRoomRequests = async () => {
        try {
            const res = await axiosInstance.get(endpoints.roomStatus);
            setRequests(res.data.results); 
        } catch (err) {
            console.error("Lỗi khi tải danh sách yêu cầu phòng:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomRequests();
    }, []);

    const filteredRequests = requests.filter((r) => r.status === selectedStatus);

    const renderRoomItem = ({ item }) => (
        <TouchableOpacity>
            <View style={styles.roomItem}>
                <MaterialCommunityIcons name="ticket-confirmation-outline" size={25} color="#1E319D" />
                <View style={{ marginLeft: 10 }}>
                    <Text style={styles.roomText}>
                        Yêu cầu chuyển đến phòng {item.requested_room}
                    </Text>
                    <Text style={styles.subText}>
                       {new Date(item.created_at).toLocaleString("vi-VN")}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );


    return (
        <View style={styles.container}>
            <View style={styles.chipContainer}>
                {["PENDING", "APPROVED", "REJECTED"].map((status) => (
                    <Chip
                        key={status}
                        icon={
                            status === "PENDING"
                                ? "alert"
                                : status === "APPROVED"
                                    ? "check"
                                    : "close"
                        }
                        selected={selectedStatus === status}
                        onPress={() => setSelectedStatus(status)}
                        style={[
                            styles.chip,
                            selectedStatus === status && styles.chipSelected
                        ]}
                    >
                        {statusLabels[status]}
                    </Chip>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#1E319D" style={{ marginTop: 30 }} />
            ) : (
                <FlatList
                    data={filteredRequests}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderRoomItem}
                    style={styles.list}
                    ListEmptyComponent={
                        <Text style={{ textAlign: "center", marginTop: 20 }}>
                            Không có yêu cầu nào.
                        </Text>
                    }
                />
            )}
        </View>
    );
};

export default RoomStatus;
