import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import styles from './StyleExtensionsPayBills';
import axiosInstance from "../../configs/AxiosInterceptor";
import { endpoints } from "../../configs/Apis";


const ExtensionsPayBills = () => {
    const nav = useNavigation();
    const [selectedStatus, setSelectedStatus] = useState('unpaid');
    const [unpaidBills, setUnpaidBills] = useState([]);
    const [paidBills, setPaidBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadBills = async () => {
        try {
            const res = await axiosInstance.get(endpoints.bills);

            const unpaid = [];
            const paid = [];

            for (let bill of res.data.results) {
                const item = {
                    id: bill.id.toString(),
                    title: (bill.description?.split('\n')[0]) || `Hóa đơn #${bill.id}`,
                };

                const status = bill.status.toLowerCase();

                if (status === 'paid') {
                    paid.push(item);
                } else if (status === 'unpaid') {
                    unpaid.push(item);
                }
            }

            setPaidBills(paid);
            setUnpaidBills(unpaid);

        } catch (err) {
            console.error("Lỗi khi lấy danh sách hóa đơn:", err.response ? err.response.data : err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBills();
    }, []);

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            await loadBills();
        } finally {
            setRefreshing(false);
        }
    };

    const renderBillItem = ({ item }) => (
        <TouchableOpacity onPress={() => nav.navigate("extensionsPayBillsDetails", { billId: item.id })}>
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
                    style={[styles.chip, selectedStatus === 'unpaid' && styles.chipSelected]}
                >
                    Chưa thanh toán
                </Chip>
                <Chip
                    icon="check"
                    selected={selectedStatus === 'paid'}
                    onPress={() => setSelectedStatus('paid')}
                    style={[styles.chip, selectedStatus === 'paid' && styles.chipSelected]}
                >
                    Đã thanh toán
                </Chip>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#1E319D" />
            ) : (
                selectedStatus === 'unpaid' && unpaidBills.length === 0 ||
                    selectedStatus === 'paid' && paidBills.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 20 }}>
                        <Text style={{ fontSize: 16, color: '#555' }}>Không có hóa đơn nào</Text>
                    </View>
                ) : (
                    <FlatList
                        data={selectedStatus === 'unpaid' ? unpaidBills : paidBills}
                        keyExtractor={(item) => item.id}
                        renderItem={renderBillItem}
                        style={styles.list}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                )
            )}

        </View>
    );
};

export default ExtensionsPayBills;
