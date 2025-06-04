import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Linking, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { authApis, endpoints } from '../../configs/Apis';
import axiosInstance from "../../configs/AxiosInterceptor";
import styles from './StyleExtensionsPayBillsDetails';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';


const ExtensionsPayBillsDetails = () => {
    const nav = useNavigation();

    const route = useRoute();
    const { billId } = route.params;
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isPaying, setIsPaying] = useState(false);
    const [token, setToken] = useState(null);
    const [paymentMethodId, setPaymentMethodId] = useState(null);
    const [linkPayMeImg, setLinkPayMeImg] = useState(null);


    const fetchBillDetails = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await axiosInstance.get(`${endpoints.bills}${billId}/`, {
                timeout: 10000,
            });
            setBill(res.data);


        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu hóa đơn:", error);
            Alert.alert("Lỗi", "Không thể tải thông tin hóa đơn. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [billId, token]);


    const fetchTokenAndPaymentMethods = useCallback(async () => {
        try {
            const storedToken = await AsyncStorage.getItem("token");
            setToken(storedToken);

            const response = await authApis(storedToken).get(endpoints.paymentMethods, {
                timeout: 10000,
            });
           
            if (momoMethod) {
                setPaymentMethodId(momoMethod.id);
                setLinkPayMeImg(momoMethod.image);
            } else {
                throw new Error("Không tìm thấy phương thức thanh toán MoMo.");
            }
            return true;
        } catch (error) {
            console.error("Lỗi khi lấy token hoặc phương thức thanh toán:", error);
            setPaymentMethodId(2);
            return false;
        }
    }, [nav]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchTokenAndPaymentMethods().then((success) => {
                if (success) {
                    fetchBillDetails();
                } else {
                    setLoading(false);
                }
            });
        }, [fetchTokenAndPaymentMethods, fetchBillDetails])
    );

    useEffect(() => {
        const handleDeepLink = async ({ url }) => {
            if (url.includes("payment_success") || url.includes("momo_notify")) {
                try {
                    const transactionId = new URL(url).searchParams.get("orderId");
                    if (transactionId && token) {
                        const response = await axiosInstance.get(
                            `${endpoints.paymentTransactions}?transaction_id=${transactionId}`,
                            { timeout: 10000 }
                        );

                        if (response.data && response.data.length > 0) {
                            const transaction = response.data[0];
                            if (transaction.status === "SUCCESS") {
                                Alert.alert("Thành công", "Thanh toán hóa đơn thành công!", [
                                    { text: "OK", onPress: () => nav.goBack() },
                                ]);
                                fetchBillDetails(); 
                            } else {
                                Alert.alert("Thất bại", "Thanh toán không thành công. Vui lòng thử lại.");
                            }
                        } else {
                            Alert.alert("Lỗi", "Không tìm thấy giao dịch.");
                        }
                    } else {
                        Alert.alert("Lỗi", "Không tìm thấy mã giao dịch hoặc token.");
                    }
                } catch (error) {
                    console.error("Error handling deep link:", error);
                    Alert.alert("Lỗi", "Không thể xử lý chuyển hướng.");
                }
            }
        };

        Linking.addEventListener("url", handleDeepLink);
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink({ url });
        });

        return () => Linking.removeAllListeners("url");
    }, [billId, token, nav, fetchBillDetails]);

    const initiatePayment = async () => {
        setIsPaying(true);
        try {
            const formData = new FormData();
            formData.append("bill_id", billId);
            formData.append("payment_method_id", paymentMethodId);

            const response = await axiosInstance.post(endpoints.initiatePayment, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 10000,
            });

            if (response.data.status === "success") {
                await handlePayment(response.data.pay_url);
            } else {
                Alert.alert("Lỗi", response.data.message || "Không thể khởi tạo thanh toán.");
            }
        } catch (error) {
            console.error("Error initiating payment:", error);
            Alert.alert("Lỗi", error.response?.data?.message || "Đã có lỗi xảy ra khi kết nối với server.");
        } finally {
            setIsPaying(false);
        }
    };

    const handlePayment = async (payUrl) => {
        try {
            if (!payUrl) throw new Error("Không có URL thanh toán.");
            const supported = await Linking.canOpenURL(payUrl);
            if (!supported) throw new Error("Không thể mở URL thanh toán.");
            await Linking.openURL(payUrl);
        } catch (error) {
            console.error("Error opening payUrl:", error);
            Alert.alert("Lỗi", "Không thể mở ứng dụng MoMo hoặc trình duyệt.");
        }
    };

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

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa có';
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN');
    };

    return (
        <View style={styles.container}>
            <ScrollView style={{ flex: 1 }}>
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
                        .split('\n')                      
                        .slice(1)   
                        .map((item, index) => {
                            const parts = item.split(':'); 
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
            </ScrollView>


            <TouchableOpacity
                style={[styles.payButton, (isPaying || bill.status === "PAID") && styles.disabledButton]}
                onPress={initiatePayment}
                disabled={isPaying || bill.status === "PAID"}
            >
                <View style={styles.pay}>
                    {bill.status === "UNPAID" && (
                        <Image
                            source={{
                                uri: linkPayMeImg || "https://res.cloudinary.com/dywyrpfw7/image/upload/v1746024600/KTX-SV/jumz5ambmmp9craluwoo.png",
                            }}
                            style={styles.payIcon}
                        />
                    )}
                    <Text style={styles.payText}>
                        {isPaying ? "Đang xử lý..." : bill.status === "PAID" ? "Đã thanh toán" : "Thanh toán qua MoMo"}
                    </Text>
                </View>
            </TouchableOpacity>


        </View>
    );
};

export default ExtensionsPayBillsDetails;

