import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// import { BarCodeScanner } from 'expo-barcode-scanner';

const HomeQR = () => {
    const navigation = useNavigation();
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);

    // useEffect(() => {
    //     (async () => {
    //         const { status } = await BarCodeScanner.requestPermissionsAsync();
    //         setHasPermission(status === 'granted');
    //     })();
    // }, []);

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        Alert.alert('QR Code Scanned', `Loại: ${type}\nNội dung: ${data}`);
        // Xử lý dữ liệu tại đây (ví dụ: điều hướng hoặc API)
    };

    if (hasPermission === null) {
        return <Text>Đang yêu cầu quyền truy cập camera...</Text>;
    }

    if (hasPermission === false) {
        return <Text>Bạn chưa cho phép truy cập camera.</Text>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>Quét mã QR của bạn</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* <View style={styles.qrBox}>
                <BarCodeScanner
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                    style={StyleSheet.absoluteFillObject}
                />
            </View> */}

            {scanned && (
                <TouchableOpacity onPress={() => setScanned(false)}>
                    <Text style={{ color: '#00f' }}>Quét lại</Text>
                </TouchableOpacity>
            )}

            <Text style={styles.hint}>
                Giữ điện thoại ổn định và cách mã QR một khoảng vừa phải
            </Text>
        </View>
    );
};

export default HomeQR;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
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
        color: 'white',
        fontWeight: '600',
    },
    qrBox: {
        width: 260,
        height: 260,
        overflow: 'hidden',
        borderRadius: 24,
        borderColor: '#999',
        borderWidth: 4,
        marginBottom: 32,
    },
    hint: {
        color: '#aaa',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 'auto',
        marginBottom: 30,
    },
});
