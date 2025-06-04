import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axiosInstance from "../../configs/AxiosInterceptor";
import { endpoints } from "../../configs/Apis";



const HomeQR = () => {
    const navigation = useNavigation();
    const [qrCode, setQrCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!qrCode.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập mã QR');
            return;
        }

        setLoading(true);
        try {

            const res = await axiosInstance.post(endpoints.checkinoutLogs, {
                qr_token: qrCode.trim()
            });

            if (res.data.status === 'success') {
                Alert.alert('Thành công', res.data.message || 'Checkin/Checkout thành công!');
                setQrCode('');
                navigation.goBack();
            } else {
                Alert.alert('Thất bại', res.data.message || 'Không thể checkin/checkout.');
            }

        } catch (error) {
            console.log('Lỗi khi gửi checkin/checkout:', error);
            Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={35} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Nhập mã QR của bạn</Text>
                <View style={{ width: 28 }} />
            </View>
            <View style={styles.footer}>
                <TextInput
                    style={styles.input}
                    placeholder="Nhập hoặc dán mã QR"
                    placeholderTextColor="#888"
                    value={qrCode}
                    onChangeText={setQrCode}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                />

                <TouchableOpacity
                    style={[styles.button, loading && { backgroundColor: '#555' }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Gửi</Text>
                    )}
                </TouchableOpacity>
            </View>


            <Text style={styles.hint}>
                Nhập đúng mã QR để checkin/checkout khi ra vào ký túc xá trường
            </Text>
        </View>
    );
};

export default HomeQR;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D5D5D5',
        paddingTop: 60,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    title: {
        fontSize: 20,
        color: 'black',
        fontWeight: '600',
    },
    footer: {
        flex: 1,
        width: '100%',
        marginTop: 220
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#666',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        color: 'black',
        fontSize: 16,
        marginBottom: 20,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#1E319D',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    hint: {
        color: '#aaa',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 'auto',
        marginBottom: 30,
    },
});
