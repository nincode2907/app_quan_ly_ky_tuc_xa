import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSearchContext } from '../../contexts/SearchContext';
import axiosInstance from "../../configs/AxiosInterceptor";
import { endpoints } from '../../configs/Apis';
import { toggleFavoriteRoom } from '../../configs/RoomApi';
import styles from './Style';

const Rooms = () => {
    const nav = useNavigation();
    const { searchText, setSearchText } = useSearchContext();

    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const debounceTimeoutRef = useRef(null);

    const loadRooms = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(endpoints.rooms);

            if (res.status !== 200 || !Array.isArray(res.data)) {
                throw new Error("Lỗi dữ liệu hoặc phản hồi không hợp lệ");
            }

            const fetched = res.data.map(room => ({
                id: room.id.toString(),
                name: `Phòng ${room.number} ${room.building.area?.name ?? ''} Tòa ${room.building.name} - KTX ${room.building.gender === 'male' ? 'Nam' : 'Nữ'} - Loại phòng ${room.room_type.name}`,
                price: `${room.room_type.price.toLocaleString()}₫/tháng`,
                image: room.image || 'https://res.cloudinary.com/dywyrpfw7/image/upload/v1744606423/jpcya6itafrlh7inth29.jpg',
                people: `${room.room_type.capacity - room.available_slots}/${room.room_type.capacity} người`,
                time: '1 giờ trước',
                is_favorite: room.is_favorite,
            }));

            setRooms(fetched);
            setFilteredRooms(filterRooms(fetched, searchText));
        } catch (err) {
            console.error("Lỗi khi fetch rooms:", err);
            Alert.alert("Lỗi", "Không thể tải danh sách phòng. Vui lòng thử lại.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const filterRooms = (roomList, search) => {
        const keyword = search.toLowerCase().trim();
        return roomList.filter(room => room.name.toLowerCase().includes(keyword));
    };

    useEffect(() => {
        loadRooms();
    }, []);

    useEffect(() => {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

        debounceTimeoutRef.current = setTimeout(() => {
            setFilteredRooms(filterRooms(rooms, searchText));
        }, 300);

        return () => clearTimeout(debounceTimeoutRef.current);
    }, [searchText, rooms]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadRooms();
    };

    useFocusEffect(
        useCallback(() => {
            return () => {
                setSearchText('');
            };
        }, [setSearchText])
    );

    const toggleFavorite = async (roomId) => {
        setFilteredRooms(prev => prev.map(r => r.id === roomId.toString() ? { ...r, is_favorite: !r.is_favorite } : r));

        try {
            const data = await toggleFavoriteRoom(roomId);
            if (data?.is_favorite === undefined) throw new Error("Phản hồi không hợp lệ từ server");

            setFilteredRooms(prev => prev.map(r => r.id === roomId.toString() ? { ...r, is_favorite: data.is_favorite } : r));
        } catch (err) {
            console.error("Lỗi toggle yêu thích:", err);
            Alert.alert("Lỗi", err.message || "Không thể cập nhật trạng thái yêu thích.");
            setFilteredRooms(prev => prev.map(r => r.id === roomId.toString() ? { ...r, is_favorite: !r.is_favorite } : r));
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => nav.navigate('roomDetails', { roomId: item.id, isFavorite: item.is_favorite })}>
            <View style={styles.card}>
                <Image source={{ uri: item.image }} style={styles.roomImage} />
                <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>{item.name}</Text>
                    <Text style={styles.roomPrice}>{item.price}</Text>
                    <Text style={styles.roomTime}>{item.time}</Text>
                    <View style={styles.roomBottom}>
                        <View style={styles.roomPeople}>
                            <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                                <AntDesign name="heart" size={16} color={item.is_favorite ? 'red' : '#ccc'} />
                            </TouchableOpacity>
                            <Text style={styles.peopleText}>{item.people}</Text>
                        </View>
                        <TouchableOpacity onPress={() => nav.navigate('roomDetails', { roomId: item.id, isFavorite: item.is_favorite })}>
                            <Text style={styles.viewMore}>Xem thêm...</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm tòa, khu, phòng và số phòng..."
                    placeholderTextColor="#B0B0B0"
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                />
                <Ionicons style={styles.search} name="search" size={20} color="#B0B0B0" />
            </View>

            <View style={styles.filterBar}>
                <Text style={styles.filterText}>Danh sách phòng</Text>
                <View style={styles.iconBar}>
                    <TouchableOpacity onPress={() => nav.navigate("roomStatus")}>
                        <Ionicons name="hourglass-outline" size={20} color="#E3C7A5" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && filteredRooms.length === 0 ? (
                <ActivityIndicator size="large" color="#E3C7A5" style={{ marginTop: 20 }} />
            ) : filteredRooms.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>
                    Không có phòng nào phù hợp.
                </Text>
            ) : (
                <FlatList
                    data={filteredRooms}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.roomList}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}
        </View>
    );
};

export default Rooms;
