import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import StyleRoomDetails from './StyleRoomDetails';
import { endpoints } from '../../configs/Apis';
import axiosInstance from "../../configs/AxiosInterceptor";
import { toggleFavoriteRoom } from '../../configs/RoomApi';

const RoomDetails = () => {
    const nav = useNavigation();
    const route = useRoute();
    const { roomId, isFavorite } = route.params;

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleToggleFavorite = async () => {
        try {
            if (!room) return;

            const data = await toggleFavoriteRoom(room.id);

            if (data && typeof data.is_favorite === "boolean") {
                setRoom({
                    ...room,
                    is_favorite: data.is_favorite ?? isFavorite,
                });
            }
        } catch (error) {
            console.error("Lỗi khi toggle favorite:", error);
            Alert.alert("Lỗi", "Không thể thay đổi trạng thái yêu thích. Vui lòng thử lại.");
        }
    };

    const loadRoomDetails = async () => {
        try {
            const url = `${endpoints.rooms.endsWith('/') ? endpoints.rooms : endpoints.rooms + '/'}${roomId}/`;
            const response = await axiosInstance.get(url);
            setRoom(response.data);
        } catch (error) {
            console.error('Lỗi khi tải chi tiết phòng:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoomDetails();
    }, [roomId]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#E3C7A5" />
            </View>
        );
    }

    if (!room) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Không thể tải dữ liệu phòng.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={StyleRoomDetails.container}>
                <Image
                    source={{ uri: room.image || 'https://res.cloudinary.com/dywyrpfw7/image/upload/v1744606423/jpcya6itafrlh7inth29.jpg' }}
                    style={StyleRoomDetails.roomImage}
                />

                <View style={StyleRoomDetails.infoContainer}>
                    <View style={StyleRoomDetails.headerRow}>
                        <Text style={StyleRoomDetails.roomName}>
                            Phòng {room.number} - Tòa {room.building?.name} - Loại phòng {room.room_type.name}
                        </Text>
                    </View>

                    <Text style={StyleRoomDetails.roomPrice}>
                        {room.room_type?.price.toLocaleString()} VNĐ
                    </Text>

                    <View style={StyleRoomDetails.infoRow}>
                        <AntDesign name="user" size={18} color="#B0B0B0" />
                        <Text style={StyleRoomDetails.infoText}>
                            {room.available_slots}/{room.room_type?.capacity}
                        </Text>
                    </View>

                    <View style={StyleRoomDetails.infoRow}>
                        <Ionicons name="home-outline" size={18} color="#B0B0B0" />
                        <Text style={StyleRoomDetails.infoText}>
                            Tầng {room.floor} - {room.building?.area?.name}
                        </Text>
                    </View>

                    <Text style={[StyleRoomDetails.title, { marginTop: 16 }]}>
                        Thông tin chi tiết phòng
                    </Text>
                    <Text style={StyleRoomDetails.description}>
                        {room.room_type?.description || 'Phòng đầy đủ tiện nghi: máy lạnh, wifi tốc độ cao, giường tầng, vệ sinh riêng,...'}
                    </Text>
                </View>
            </ScrollView>

            <View style={StyleRoomDetails.buttonContainer}>
                <TouchableOpacity
                    style={StyleRoomDetails.button}
                    onPress={() => nav.navigate('roomRegister', {
                        roomId: room.id,
                        roomNumber: room.number,
                        buildingName: room.building?.name,
                    })}
                >
                    <Ionicons name="sync-outline" size={22} color="#E3C7A5" />
                    <Text style={StyleRoomDetails.buttonText}>  Đăng ký phòng</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default RoomDetails;
