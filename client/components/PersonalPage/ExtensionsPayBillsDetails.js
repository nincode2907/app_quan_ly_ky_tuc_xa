import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import styles from './StyleExtensionsPayBillsDetails';
import { endpoints } from '../../configs/Apis';
import axiosInstance from "../../configs/AxiosInterceptor";


const ExtensionsPayBillsDetails = () => {
    const route = useRoute();
    const { billId } = route.params;
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    // const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchBillDetails = async () => {
            try {
                const res = await axiosInstance.get(`${endpoints.bills}${billId}/`);
                setBill(res.data);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu hóa đơn:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBillDetails();
    }, [billId]);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#E3C7A5" />
            </View>
        );
    }

    if (!bill) {
        return (
            <View style={styles.container}>
                <Text style={styles.infoText}>Không tìm thấy hóa đơn.</Text>
            </View>
        );
    }

    const student = bill.student;
    const email = student?.user?.email || 'Không có email';
    const status = bill.status.toUpperCase();
    const statusColor = status === 'PAID' ? 'green' : (status === 'UNPAID' ? 'red' : 'gray');
    const statusIcon = status === 'PAID' ? 'checkmark-circle' : (status === 'UNPAID' ? 'close-circle' : 'help-circle');

    // Format ngày (ví dụ lấy ngày dạng dd/mm/yyyy)
    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa có';
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN');
    };

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <View style={styles.infoButton}>
                    <Text style={styles.infoButtonText}>Thông tin sinh viên & phòng</Text>
                </View>
                <Text style={styles.infoText}>Họ và tên & MSSV: {student.full_name} - {student.student_id}</Text>
                <Text style={styles.infoText}>Khoa: {student.faculty?.name || "Chưa có"}</Text>
                <Text style={styles.infoText}>
                    Tòa nhà - Số phòng: {student.room ? student.room.building.name + " - " + student.room.number : "Chưa có"}
                </Text>
                <Text style={styles.infoText}>
                    Số lượng sinh viên: {student.room ? student.room.room_type.capacity : "Chưa có"} sinh viên
                </Text>
            </View>

            <View style={styles.billSection}>
                <View style={styles.billHeaderRow}>
                    <Text style={styles.monthText}>{bill.description?.split('\n')[0]}</Text>
                    <View style={styles.statusBox}>
                        <Ionicons name={statusIcon} size={16} color={statusColor} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
                    </View>
                </View>

                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderCell}>STT</Text>
                    <Text style={styles.tableHeaderCell}>Khoản thu</Text>
                    <Text style={styles.tableHeaderCell}>Đơn giá (VNĐ)</Text>
                </View>

                {bill.description
                    .split('\n')                      // Tách từng dòng
                    .slice(1)                         // Bỏ dòng đầu tiên (ví dụ: "Hóa đơn tháng 5/2025")
                    .map((item, index) => {
                        const parts = item.split(':'); // Tách tên khoản và số tiền
                        const title = parts[0].replace('- ', '').trim();
                        const value = parts[1]?.trim().replace(' VNĐ', '') || '0';
                        return (
                            <View style={styles.tableRow} key={index}>
                                <Text style={styles.tableCell}>{index + 1}</Text>
                                <Text style={styles.tableCell}>{title}</Text>
                                <Text style={styles.tableCell}>{Number(value).toLocaleString()}₫</Text>
                            </View>
                        );
                    })}

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tổng chi phí cần trả</Text>
                    <Text style={styles.totalAmount}>{Number(bill.amount).toLocaleString()}₫</Text>
                </View>

                <View style={{ marginTop: 10 }}>
                    <Text style={styles.infoText}>Ngày đến hạn: {formatDate(bill.due_date)}</Text>
                    <Text style={styles.infoText}>Ngày thanh toán: {bill.paid_date ? formatDate(bill.paid_date) : "Chưa thanh toán"}</Text>
                </View>
            </View>

            <View style={styles.emailSection}>
                <View style={styles.emailButton}>
                    <Text style={styles.emailLabel}>Email nhận hóa đơn điện tử</Text>
                </View>
                <Text style={styles.emailText}>{email}</Text>
            </View>

            {/* onPress={() => setModalVisible(true)} */}
            <TouchableOpacity style={styles.payButton} >
                {/* <Ionicons name="card-outline" size={24} color="#E3C7A5" /> */}
                <View style={styles.pay}>
                    <Image
                        source={{
                            uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1746024600/KTX-SV/jumz5ambmmp9craluwoo.png"
                        }}
                        style={styles.payIcon}
                    />
                    <Text style={styles.payText}>Thanh toán với MoMo</Text>
                </View>
            </TouchableOpacity>

            {/* <Modal
                visible={modalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.dialog}>
                        <Text style={styles.dialogTitle}>Chọn phương thức thanh toán</Text>
                        <View style={styles.dialogContainer}>
                            {[...Array(3)].map((_, i) => (
                                <TouchableOpacity key={i} style={styles.dialogOption}>
                                    <Image
                                        source={{
                                            uri: [
                                                "https://res.cloudinary.com/dywyrpfw7/image/upload/v1746025250/KTX-SV/lwifxokllu6cnajdk0cu.png",
                                                // "https://res.cloudinary.com/dywyrpfw7/image/upload/v1746024601/KTX-SV/awv3f0rodnthvyfajmrb.jpg",
                                                // "https://res.cloudinary.com/dywyrpfw7/image/upload/v1746024601/KTX-SV/tjjvcmk89nr19etusv1m.jpg"
                                            ][i]
                                        }}
                                        style={styles.paymentIcon}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Pressable>
            </Modal> */}
        </View>
    );
};

export default ExtensionsPayBillsDetails;

