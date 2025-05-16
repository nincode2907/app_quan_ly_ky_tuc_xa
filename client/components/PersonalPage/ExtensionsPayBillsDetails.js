import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './StyleExtensionsPayBillsDetails';

const ExtensionsPayBillsDetails = () => {

    const [modalVisible, setModalVisible] = useState(false);

    const [studentInfo] = useState({
        building: 'KTX A',
        room: '402',
        numberOfStudents: 4,
        name: 'Nguyễn Văn A',
        mssv: '20231234'
    });

    const [billDetails] = useState([
        { id: 1, name: 'Tiền phòng', price: 1500000 },
        { id: 2, name: 'Phụ phí (vệ sinh)', price: 100000 },
        { id: 3, name: 'Phí trễ hạn', price: 50000 },
    ]);

    const total = billDetails.reduce((sum, item) => sum + item.price, 0);

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <View style={styles.infoButton}>
                    <Text style={styles.infoButtonText}>Thông tin sinh viên & phòng</Text>
                </View>
                <Text style={styles.infoText}>Tòa nhà - Số phòng: {studentInfo.building} - {studentInfo.room}</Text>
                <Text style={styles.infoText}>Số lượng sinh viên: {studentInfo.numberOfStudents} sinh viên</Text>
                <Text style={styles.infoText}>Họ và tên & MSSV: {studentInfo.name} - {studentInfo.mssv}</Text>
            </View>

            <View style={styles.billSection}>
                <View style={styles.billHeaderRow}>
                    <Text style={styles.monthText}>Tháng 3 năm 2025</Text>
                    <View style={styles.statusBox}>
                        <Ionicons name="close-circle" size={16} color="red" />
                        <Text style={styles.statusText}>Trạng thái</Text>
                    </View>
                </View>

                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderCell}>STT</Text>
                    <Text style={styles.tableHeaderCell}>Khoản thu</Text>
                    <Text style={styles.tableHeaderCell}>Đơn giá (VNĐ)</Text>
                </View>

                {billDetails.map((item, index) => (
                    <View key={item.id} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{index + 1}</Text>
                        <Text style={styles.tableCell}>{item.name}</Text>
                        <Text style={styles.tableCell}>{item.price.toLocaleString()}</Text>
                    </View>
                ))}

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tổng chi phí cần trả</Text>
                    <Text style={styles.totalAmount}>{total.toLocaleString()}₫</Text>
                </View>
            </View>

            <View style={styles.emailSection}>
                <View style={styles.emailButton}>
                    <Text style={styles.emailLabel}>Email nhận hóa đơn điện tử </Text>
                </View>
                <Text style={styles.emailText}>nguyenvana@ou.edu.vn</Text>
            </View>

            <TouchableOpacity style={styles.payButton} onPress={() => setModalVisible(true)}>
                <Ionicons name="card-outline" size={24} color="#E3C7A5" />
                <Text style={styles.payText}>Thanh toán</Text>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.dialog}>
                        <Text style={styles.dialogTitle}>Chọn phương thức thanh toán</Text>
                        <View style={styles.dialogContainer}>
                            <TouchableOpacity style={styles.dialogOption}>
                                    <Image
                                        source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1746025250/KTX-SV/lwifxokllu6cnajdk0cu.png" }}
                                        style={styles.paymentIcon}
                                    />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.dialogOption}>
                                    <Image
                                        source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1746024601/KTX-SV/awv3f0rodnthvyfajmrb.jpg" }}
                                        style={styles.paymentIcon}
                                    />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.dialogOption}>
                                    <Image
                                        source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1746024601/KTX-SV/tjjvcmk89nr19etusv1m.jpg" }}
                                        style={styles.paymentIcon}
                                    />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Pressable>
            </Modal>

        </View>
    );
};

export default ExtensionsPayBillsDetails;
