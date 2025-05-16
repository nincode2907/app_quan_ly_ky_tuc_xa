import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import styles from './StyleRepairSupport';


const RepairSupport = () => {

    const [selectedStatus, setSelectedStatus] = useState('unpaid');
    const nav = useNavigation();

    const processing = [
        { id: '1', title: 'Quạt trần không sử dụng được', time: '30-04-2025', level: 'Cao' },
        { id: '2', title: 'Cánh cửa tủ bị hư bản lề', time: '20-04-2025', level: 'Thấp' },
    ];

    const processed = [
        { id: '3', title: 'Bàn học bị hư', time: '10-02-2025', level: 'Trung bình' }
    ];

    const getLevelColor = (level) => {
        switch (level) {
            case 'Cao': return 'red';
            case 'Trung bình': return 'orange';
            case 'Thấp': return 'green';
            default: return '#1E319D';
        }
    };

    const renderRepairItem = ({ item }) => (
        <TouchableOpacity>
            <View style={styles.repairItem}>
                <MaterialCommunityIcons
                    name="ticket-confirmation-outline"
                    size={25}
                    color={getLevelColor(item.level)}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.repairText}>{item.title}</Text>
                    <Text style={styles.repairTime}>{item.time}</Text>
                </View>
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
                    Đang xử lý
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
                    Đã xử lý
                </Chip>
            </View>

            <FlatList
                data={selectedStatus === 'unpaid' ? processing : processed}
                keyExtractor={(item) => item.id}
                renderItem={renderRepairItem}
                style={styles.list}
            />

            <TouchableOpacity
                style={styles.supportButton}
                onPress={() => nav.navigate("repairSupportDetails")}
            >
                <Text style={styles.supportButtonText}>Yêu cầu hỗ trợ mới</Text>
            </TouchableOpacity>
        </View>
    );
};
export default RepairSupport;