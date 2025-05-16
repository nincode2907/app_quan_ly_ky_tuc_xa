import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import styles from './StyleExtensionsPayBills';

const ExtensionsPayBills = () => {
    const nav = useNavigation();
    const [selectedStatus, setSelectedStatus] = useState('unpaid');

    const unpaidBills = [
        { id: '1', title: 'Hóa đơn thanh toán tháng 3' },
    ];

    const paidBills = [
        { id: '3', title: 'Hóa đơn thanh toán tháng 2' },
        { id: '4', title: 'Hóa đơn thanh toán tháng 1' },
    ];

    const renderBillItem = ({ item }) => (
        <TouchableOpacity onPress={() => nav.navigate("extensionsPayBillsDetails")}>
            <View style={styles.billItem}>
                <MaterialCommunityIcons name="ticket-confirmation-outline" size={25} color="#1E319D" />
                <Text style={styles.billText}>{item.title}</Text>
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
                    Chưa thanh toán
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
                    Đã thanh toán
                </Chip>
            </View>

            <FlatList
                data={selectedStatus === 'unpaid' ? unpaidBills : paidBills}
                keyExtractor={(item) => item.id}
                renderItem={renderBillItem}
                style={styles.list}
            />
        </View>

    );
};

export default ExtensionsPayBills;
