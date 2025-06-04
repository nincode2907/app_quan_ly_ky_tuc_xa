import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLikedRooms } from '../../contexts/LikedRoomsContext';
import styles from './StyleExtensionsFavouriteRoom';

const InvoiceDetails = () => {
    const nav = useNavigation();
    const { likedRooms, toggleLike } = useLikedRooms();

    const likedRoomsArray = Object.values(likedRooms); 

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => nav.navigate('roomDetails', { room: item })}>
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
                        <TouchableOpacity onPress={() => nav.navigate('roomDetails', { room: item })}>
                            <Text style={styles.viewMore}>Xem thêm...</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.filterText}>Phòng yêu thích</Text>
            <FlatList
                data={likedRoomsArray}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.roomList}
                ListEmptyComponent={<Text style={styles.emptyText}>Bạn chưa thích phòng nào.</Text>}
            />
        </View>
    );
};

export default InvoiceDetails;
