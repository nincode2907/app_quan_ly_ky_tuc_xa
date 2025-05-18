import React, { useState } from 'react';
import { View, TextInput, Button, Alert, Text, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { authApis, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RoomRegister = ({ route, navigation }) => {
    const { roomId, roomNumber, buildingName } = route.params;
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const api = authApis(token);

            const formData = new FormData();
            formData.append('requested_room_id', roomId.toString()); // FormData yêu cầu string
            formData.append('reason', reason);

            const res = await api.post(endpoints.roomRequest, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Quan trọng: đúng kiểu backend cần
                },
            });

            Alert.alert("Thành công", res.data.message || "Đã gửi yêu cầu.");
            navigation.navigate('roomStatus');
        } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", err.response?.data?.error || "Gửi yêu cầu thất bại.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <KeyboardAvoidingView
            style={{ flex: 1, padding: 20 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, marginBottom: 10 }}>
                    Đăng ký phòng: {roomNumber ? `Phòng ${roomNumber}` : ''} {buildingName ? `- ${buildingName}` : ''}
                </Text>

                <TextInput
                    placeholder="Lý do (bắt buộc nếu đổi phòng)"
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={4}
                    style={{
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 12,
                        textAlignVertical: 'top',
                        backgroundColor: '#fff',
                        marginBottom: 20
                    }}
                />

                {loading ? (
                    <ActivityIndicator size="large" color="#E3C7A5" />
                ) : (
                    <Button title="Xác nhận" onPress={handleSubmit} />
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default RoomRegister;
