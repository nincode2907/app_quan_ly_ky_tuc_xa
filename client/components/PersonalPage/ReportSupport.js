import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import styles from './StyleReportSupport';
import axiosInstance from "../../configs/AxiosInterceptor";
import { endpoints } from '../../configs/Apis';

const ReportSupport = () => {
    const [selectedStatus, setSelectedStatus] = useState('pending');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const nav = useNavigation();


    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(endpoints.issueReport);
            setData(res.data.results);
        } catch (err) {
            console.error("Lỗi khi tải danh sách sự cố:", err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const getLevelColor = (level) => {
        switch (level) {
            case 'Cao': return 'red';
            case 'Trung bình': return 'orange';
            case 'Thấp': return 'green';
            default: return '#1E319D';
        }
    };

    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${hours}:${minutes} - ${day}/${month}/${year}`;
    };


    const STATUS = {
        pending: 'PENDING',
        approved: 'RESOLVED',
    };
    const filteredData = data.filter(item => item.status === STATUS[selectedStatus]);

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            await fetchData();
        } finally {
            setRefreshing(false);
        }
    };

    const renderReportItem = ({ item }) => (
        <TouchableOpacity>
            <View style={styles.reportItem}>
                <View style={styles.reportItemType}>
                    <MaterialCommunityIcons
                        name="ticket-confirmation-outline"
                        size={25}
                        color={getLevelColor(item.priority)}
                    />
                    <Text style={styles.reportType}>{item.report_type}
                    </Text>
                </View>
                <View style={{ flex: 1,  gap: 5 }}>
                    <Text style={styles.reportText}>{item.title}</Text>
                    <Text style={styles.reportTime}>{formatDateTime(item.created_at)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );


    return (
        <View style={styles.container}>
            <View style={styles.chipContainer}>
                <Chip
                    icon="clock-outline"
                    selected={selectedStatus === 'pending'}
                    onPress={() => setSelectedStatus('pending')}
                    style={[styles.chip, selectedStatus === 'pending' && styles.chipSelected]}
                >
                    Chưa xử lý
                </Chip>
                <Chip
                    icon="check-circle-outline"
                    selected={selectedStatus === 'approved'}
                    onPress={() => setSelectedStatus('approved')}
                    style={[styles.chip, selectedStatus === 'approved' && styles.chipSelected]}
                >
                    Đã xử lý
                </Chip>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderReportItem}
                    style={styles.list}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}

            <TouchableOpacity
                style={styles.supportButton}
                onPress={() => nav.navigate("reportSupportDetail")}
            >
                <Text style={styles.supportButtonText}>Báo cáo sự cố mới</Text>
            </TouchableOpacity>
        </View>
    );
};

export default ReportSupport;
