import React, { useState } from 'react';
import { TextInput, Alert, Text, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, StyleSheet, TouchableOpacity, } from 'react-native';
import { endpoints } from '../../configs/Apis';
import axiosInstance from "../../configs/AxiosInterceptor";


const RoomRegister = ({ route, navigation }) => {
    const { roomId, roomNumber, buildingName } = route.params;
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [pressed, setPressed] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập lý do.');
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('requested_room_id', roomId.toString());
            formData.append('reason', reason);

            console.log('Gửi dữ liệu:', {
                requested_room_id: roomId.toString(),
                reason,
            });

            const res = await axiosInstance.post(endpoints.roomRequest, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Thành công', res.data.message || 'Đã gửi yêu cầu.');
            navigation.navigate('roomStatus');
        } catch (err) {
            Alert.alert('Lỗi', err.response?.data?.error || 'Gửi yêu cầu thất bại.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>
                    Đăng ký phòng: {roomNumber ? `Phòng ${roomNumber}` : ''}{' '}
                    {buildingName ? `- ${buildingName}` : ''}
                </Text>

                <TextInput
                    placeholder="Lý do (bắt buộc nếu đổi phòng)"
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={4}
                    style={styles.textInput}
                    editable={!loading}
                />

                {loading ? (
                    <ActivityIndicator size="large" color="#E3C7A5" style={styles.loading} />
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.button,
                            pressed && styles.buttonPressed,
                            loading && styles.buttonDisabled,
                        ]}
                        onPress={handleSubmit}
                        activeOpacity={0.8}
                        disabled={loading}
                        onPressIn={() => setPressed(true)}
                        onPressOut={() => setPressed(false)}
                    >
                        <Text style={styles.buttonText}>Xác nhận</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 220,
        padding: 20,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#222',
        textAlign: 'center',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 16,
        textAlignVertical: 'top',
        backgroundColor: '#fff',
        marginBottom: 20,
        fontSize: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    loading: {
        marginTop: 10,
    },
    button: {
        backgroundColor: '#1E319D',
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: 'center',
        shadowColor: '#C99D69',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 7,
        elevation: 5,
    },
    buttonPressed: {
        backgroundColor: '#b7976f',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default RoomRegister;
