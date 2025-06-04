import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getFavoriteRooms, toggleFavoriteRoom } from '../../configs/RoomApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './StyleExtensionsFavouriteRoom';

const ExtensionsFavouriteRoom = () => {
    const nav = useNavigation();
    const [likedRooms, setLikedRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const getToken = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            return token;
        } catch (error) {
            console.error('Lỗi khi lấy token:', error);
            return null;
        }
    };

    const loadFavoriteRooms = async () => {
        try {
            setLoading(true);

            const results = await getFavoriteRooms();

            const fetched = results.map(room => ({
                id: room.id.toString(),
                name: `Phòng ${room.number} ${room.building.area?.name ?? ''} Tòa ${room.building.name} - KTX ${room.building.gender === 'male' ? 'Nam' : 'Nữ'} - Loại phòng ${room.room_type.name}`,
                price: `${room.room_type.price.toLocaleString()}₫/tháng`,
                image: room.image || 'https://res.cloudinary.com/dywyrpfw7/image/upload/v1744606423/jpcya6itafrlh7inth29.jpg',
                people: `${room.room_type.capacity - room.available_slots}/${room.room_type.capacity} người`,
                time: '1 giờ trước',
                is_favorite: room.is_favorite,
            }));

            setLikedRooms(fetched);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải danh sách phòng yêu thích.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadFavoriteRooms();
    }, []);

    const toggleFavorite = async (room) => {
        try {
            const token = await getToken();
            if (!token) {
                Alert.alert('Thông báo', 'Bạn cần đăng nhập để thay đổi trạng thái yêu thích.');
                return;
            }

            const response = await toggleFavoriteRoom(parseInt(room.id));
            setLikedRooms(prevRooms =>
                response?.is_favorite
                    ? [...prevRooms, { ...room, is_favorite: true }]
                    : prevRooms.filter(r => r.id !== room.id)
            );
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thay đổi trạng thái yêu thích. Vui lòng thử lại.');
            console.error('Toggle favorite error:', error.response?.data || error.message);
        }
    };


    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => nav.navigate('roomDetails', { roomId: item.id })}>
            <View style={styles.card}>
                <Image source={{ uri: item.image }} style={styles.roomImage} />
                <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>{item.name}</Text>
                    <Text style={styles.roomPrice}>{item.price}</Text>
                    <Text style={styles.roomTime}>{item.time}</Text>
                    <View style={styles.roomBottom}>
                        <View style={styles.roomPeople}>
                            <TouchableOpacity onPress={() => toggleFavorite(item)}>
                                <AntDesign
                                    name="heart"
                                    size={16}
                                    color={item.is_favorite ? 'red' : '#ccc'}
                                />
                            </TouchableOpacity>
                            <Text style={styles.peopleText}>{item.people}</Text>
                        </View>
                        <TouchableOpacity onPress={() => nav.navigate('roomDetails', { roomId: item.id })}>
                            <Text style={styles.viewMore}>Xem thêm...</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#E3C7A5" />
            </View>
        );
    }

    if (likedRooms.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.emptyText}>Bạn chưa thích phòng nào.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={likedRooms}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.roomList}
            />
        </View>
    );
};

export default ExtensionsFavouriteRoom;
