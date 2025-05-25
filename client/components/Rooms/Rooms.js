import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSearchContext } from '../../contexts/SearchContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from '../../configs/Apis';
import { toggleFavoriteRoom } from '../../configs/RoomApi';
import styles from './Style';

const Rooms = () => {
    const nav = useNavigation();
    const { searchText, setSearchText } = useSearchContext();

    const [debouncedSearchText, setDebouncedSearchText] = useState(searchText);
    const [rooms, setRooms] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const debounceTimeoutRef = useRef(null);

    useEffect(() => {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

        debounceTimeoutRef.current = setTimeout(() => {
            setDebouncedSearchText(searchText.trim());
            setPage(1);
        }, 500);

        return () => {
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        };
    }, [searchText]);

    const fetchRooms = useCallback(async (targetPage = 1, search = '', append = false) => {
        if (loading) return;  

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Lỗi", "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
                setLoading(false);
                setRefreshing(false);
                return;
            }

            let url = `${endpoints.rooms}?page=${targetPage}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;

            const res = await authApis(token).get(url);

            if (res.status !== 200) {
                throw new Error(`Lỗi server: ${res.status}`);
            }

            const results = res.data;

            if (!Array.isArray(results)) {
                throw new Error("Dữ liệu phòng không hợp lệ");
            }

            const fetched = results.map(room => ({
                id: room.id.toString(),
                name: `Phòng ${room.number} ${room.building.area?.name ?? ''} Tòa ${room.building.name} - KTX ${room.building.gender === 'male' ? 'Nam' : 'Nữ'} - Loại phòng ${room.room_type.name}`,
                price: `${room.room_type.price.toLocaleString()}₫/tháng`,
                image: room.image || 'https://res.cloudinary.com/dywyrpfw7/image/upload/v1744606423/jpcya6itafrlh7inth29.jpg',
                people: `${room.room_type.capacity - room.available_slots}/${room.room_type.capacity} người`,
                time: '1 giờ trước',
                is_favorite: room.is_favorite,
            }));
            if (append) {
                setRooms(prev => [...prev, ...fetched]);
            } else {
                setRooms(fetched);
            }

            setHasMore(fetched.length > 0);
        } catch (err) {
            console.error("Lỗi khi fetch rooms:", err);
            Alert.alert("Lỗi", "Không thể tải danh sách phòng. Vui lòng thử lại.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [loading]);

    useEffect(() => {
        if (!loading) fetchRooms(1, debouncedSearchText, false);
    }, [debouncedSearchText]);

    // Khi page tăng > 1, load thêm dữ liệu (append)
    useEffect(() => {
        if (page > 1 && !loading) {
            fetchRooms(page, debouncedSearchText, true);
        }
    }, [page]);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        setPage(1);
        try {
            await fetchRooms(1, debouncedSearchText, false);
        } catch (err) {
            console.error("Lỗi khi refresh:", err);
        } finally {
            setRefreshing(false);
        }
    };

    const onPressSearch = () => {
        setPage(1);
        setDebouncedSearchText(searchText.trim());
    };

    useFocusEffect(
        useCallback(() => {
            return () => {
                setSearchText('');
            };
        }, [setSearchText])
    );

    const toggleFavorite = async (roomId) => {
        setRooms(prevRooms => prevRooms.map(r => {
            // console.log(`ID: ${r.id}, Kiểu dữ liệu: ${typeof r.id}`);
            if (r.id === roomId.toString()) {
                return { ...r, is_favorite: !r.is_favorite };
            }
            return r;
        }));

        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Lỗi", "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");

                setRooms(prevRooms => prevRooms.map(r => {
                    if (r.id === roomId.toString()) {
                        return { ...r, is_favorite: !r.is_favorite };
                    }
                    return r;
                }));
                return;
            }

            const data = await toggleFavoriteRoom(roomId, token);
            console.log('Response toggleFavoriteRoom:', data);

            if (data?.is_favorite === undefined) {
                throw new Error("Phản hồi không hợp lệ từ server");
            }

            setRooms(prevRooms => prevRooms.map(r => {
                if (r.id === roomId.toString()) {
                    return { ...r, is_favorite: data.is_favorite };
                }
                return r;
            }));

        } catch (err) {
            console.error("Lỗi khi thay đổi trạng thái yêu thích:", err);

            Alert.alert("Lỗi", err.response?.data?.error || "Không thể cập nhật trạng thái yêu thích.");

            // Rollback lại trạng thái UI
            setRooms(prevRooms => prevRooms.map(r => {
                if (r.id === roomId.toString()) {
                    return { ...r, is_favorite: !r.is_favorite };
                }
                return r;
            }));
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
                            <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
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
                    <TouchableOpacity onPress={() => nav.navigate("roomStatus")}>
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
