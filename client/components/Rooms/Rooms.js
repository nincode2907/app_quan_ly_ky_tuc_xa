import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useLikedRooms } from '../../contexts/LikedRoomsContext';
import { useSearchContext } from '../../contexts/SearchContext';
import styles from './Style';
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Rooms = () => {
    const nav = useNavigation();
    const { likedRooms, toggleLike } = useLikedRooms();
    const { searchText, setSearchText } = useSearchContext();

    const [debouncedSearchText, setDebouncedSearchText] = useState(searchText);
    const [rooms, setRooms] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Debounce search input
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            setDebouncedSearchText(searchText.trim());
            setPage(1);
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchText]);

    const fetchRooms = useCallback(async (targetPage = 1, search = '', append = false) => {
        if (loading) return;

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            let url = `${endpoints.rooms}?page=${targetPage}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            const res = await authApis(token).get(url);

            const fetched = res.data.results.map(room => ({
                id: room.id.toString(),
                name: `Phòng ${room.number} ${room.building.area.name} Tòa ${room.building.name} - KTX ${room.building.gender === 'male' ? 'Nam' : 'Nữ'} - Loại phòng ${room.room_type.name}`,
                price: `${room.room_type.price.toLocaleString()}₫/tháng`,
                image: 'https://res.cloudinary.com/dywyrpfw7/image/upload/v1744606423/jpcya6itafrlh7inth29.jpg',
                people: `${room.room_type.capacity - room.available_slots}/${room.room_type.capacity} người`,
                time: '1 giờ trước',
            }));

            if (append) {
                setRooms(prev => [...prev, ...fetched]);
            } else {
                setRooms(fetched);
            }

            setHasMore(res.data.next !== null);
        } catch (err) {
            console.error("Lỗi khi tải phòng:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [loading]);

    // Load rooms 
    useEffect(() => {
        fetchRooms(1, debouncedSearchText, false);
    }, [debouncedSearchText]);

    useEffect(() => {
        if (page > 1) {
            fetchRooms(page, debouncedSearchText, true);
        }
    }, [page]);

    const onPressSearch = () => {
        setPage(1);
        setDebouncedSearchText(searchText.trim());
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchRooms(1, debouncedSearchText, false);
    };

    useFocusEffect(
        useCallback(() => {
            return () => {
                setSearchText('');
            };
        }, [setSearchText])
    );

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
                            <AntDesign
                                name="heart"
                                size={16}
                                color={likedRooms[item.id] ? 'red' : '#ccc'}
                                onPress={() => toggleLike(item)}
                            />
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
                    onSubmitEditing={onPressSearch}
                />
                <TouchableOpacity onPress={onPressSearch}>
                    <Ionicons style={styles.search} name="search" size={20} color="#B0B0B0" />
                </TouchableOpacity>
            </View>

            <View style={styles.filterBar}>
                <Text style={styles.filterText}>Danh sách phòng</Text>
                <View style={styles.iconBar}>
                    <TouchableOpacity onPress={() => nav.navigate("roomsStatic")}>
                        <Ionicons name="hourglass-outline" size={20} color="#E3C7A5" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && rooms.length === 0 ? (
                <ActivityIndicator size="large" color="#E3C7A5" style={{ marginTop: 20 }} />
            ) : rooms.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>
                    Không có phòng nào phù hợp.
                </Text>
            ) : (
                <FlatList
                    data={rooms}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.roomList}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    ListFooterComponent={
                        loading && hasMore ? (
                            <ActivityIndicator size="small" color="#E3C7A5" style={{ marginVertical: 10 }} />
                        ) : null
                    }
                />
            )}
        </View>
    );
};

export default Rooms;
