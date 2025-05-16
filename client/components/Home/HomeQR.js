import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const HomeQR = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>Quét mã QR của bạn</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.qrBox}>
                <View style={styles.qrLine} />
            </View>

            <Text style={styles.hint}>
                Giữ tay bạn ổn định và ở khoảng vừa phải với mã QR
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
        borderColor: '#999',
        borderWidth: 4,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    qrLine: {
        width: '80%',
        height: 4,
        backgroundColor: '#999',
    },
    hint: {
        color: '#aaa',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 'auto',
        marginBottom: 30,
    },
});
