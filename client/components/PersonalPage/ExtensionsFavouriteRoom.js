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

    // Lấy token từ AsyncStorage
    const getToken = async () => {
        const token = await AsyncStorage.getItem('token');
        return token;
    };

    // Load danh sách phòng yêu thích từ API
    const loadFavoriteRooms = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) {
                Alert.alert('Thông báo', 'Bạn cần đăng nhập để xem phòng yêu thích.');
                setLikedRooms([]);
                setLoading(false);
                return;
            }
            const data = await getFavoriteRooms(token);
            setLikedRooms(data);
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

    // Toggle like / unlike một phòng
    const handleToggleLike = async (room) => {
        try {
            const token = await getToken();
            if (!token) {
                Alert.alert('Thông báo', 'Bạn cần đăng nhập để thay đổi trạng thái yêu thích.');
                return;
            }
            await toggleFavoriteRoom(room.id, token);
            // Reload danh sách phòng yêu thích sau khi thay đổi
            loadFavoriteRooms();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thay đổi trạng thái yêu thích. Vui lòng thử lại.');
            console.error(error);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => nav.navigate('roomDetails', { roomId: item.id })} style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.roomImage} />
            <View style={styles.roomInfo}>
                <Text style={styles.roomName}>{item.name || `Phòng ${item.number}`}</Text>
                <Text style={styles.roomPrice}>{item.price?.toLocaleString()} VNĐ</Text>
                <Text style={styles.roomTime}>{item.time_posted || ''}</Text>
                <View style={styles.roomBottom}>
                    <View style={styles.roomPeople}>
                        <AntDesign
                            name="heart"
                            size={16}
                            color={item.is_favorite ? 'red' : '#ccc'}
                            onPress={() => handleToggleLike(item)}
                        />
                        <Text style={styles.peopleText}>{item.people || ''}</Text>
                    </View>
                    <TouchableOpacity onPress={() => nav.navigate('roomDetails', { roomId: item.id })}>
                        <Text style={styles.viewMore}>Xem thêm...</Text>
                    </TouchableOpacity>
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
            <Text style={styles.filterText}>Phòng yêu thích</Text>
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
