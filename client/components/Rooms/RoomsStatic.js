import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Chip } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from './StyleRoomsStatic';

const RoomsStatic = () => {

    const nav = useNavigation();
    const [selectedStatus, setSelectedStatus] = useState('unpaid');
    const unpaidRooms = [
        { id: '1', title: 'Đăng ký đổi phòng' },
    ];

    const paidRooms = [
        { id: '3', title: 'Đăng ký đổi phòng' },
        { id: '4', title: 'Đăng ký đổi phòng' },
    ];

    const renderRoomItem = ({ item }) => (
        <TouchableOpacity >
            <View style={styles.roomItem}>
                <MaterialCommunityIcons name="ticket-confirmation-outline" size={25} color="#1E319D" />
                <Text style={styles.roomText}>{item.title}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.chipContainer}>
                <Chip
                    icon="alert"
                    selected={selectedStatus === 'unpaid'}
                    onPress={() => setSelectedStatus('unpaid')}
                    style={[
                        styles.chip,
                        selectedStatus === 'unpaid' && styles.chipSelected
                    ]}
                >
                    Đang tiến hành
                </Chip>
                <Chip
                    icon="check"
                    selected={selectedStatus === 'paid'}
                    onPress={() => setSelectedStatus('paid')}
                    style={[
                        styles.chip,
                        selectedStatus === 'paid' && styles.chipSelected
                    ]}
                >
                    Đã yêu cầu
                </Chip>
            </View>

            <FlatList
                data={selectedStatus === 'unpaid' ? unpaidRooms : paidRooms}
                keyExtractor={(item) => item.id}
                renderItem={renderRoomItem}
                style={styles.list}
            />
        </View>
    );
};
export default RoomsStatic;