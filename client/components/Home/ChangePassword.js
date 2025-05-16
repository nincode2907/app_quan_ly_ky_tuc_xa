import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TextInput, HelperText } from 'react-native-paper';
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from './StyleChangePassword';

const ChangePassword = () => {
    const nav = useNavigation();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const newPasswordRef = useRef();
    const confirmPasswordRef = useRef();

    const validate = () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            setMsg("Vui lòng điền đầy đủ thông tin");
            return false;
        }

        if (newPassword !== confirmPassword) {
            setMsg("Mật khẩu xác nhận không khớp");
            return false;
        }

        if (oldPassword === newPassword) {
            setMsg("Mật khẩu mới không được trùng với mật khẩu cũ");
            return false;
        }

        setMsg('');
        return true;
    };

    const changePassword = async () => {
        if (!validate()) return;

        try {
            setLoading(true);
            let token = await AsyncStorage.getItem('token');
            if (!token) throw new Error('Không tìm thấy token');

            await authApis(token).post(endpoints.changePassword, {
                old_password: oldPassword,
                new_password: newPassword
            });

            Alert.alert('Thành công', 'Mật khẩu đã được cập nhật');
            nav.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi cập nhật mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView>
            <View style={styles.container}>
                <View style={styles.form}>
                    <HelperText type="error" visible={!!msg}>
                        {msg}
                    </HelperText>

                    <Text style={styles.label}>Mật khẩu cũ</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập mật khẩu cũ"
                        secureTextEntry={!showOldPassword}
                        right={
                            <TextInput.Icon
                                icon={showOldPassword ? "eye-off" : "eye"}
                                onPress={() => setShowOldPassword(prev => !prev)}
                            />
                        }
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        returnKeyType="next"
                        onSubmitEditing={() => newPasswordRef.current?.focus()}
                    />

                    <Text style={styles.label}>Mật khẩu mới</Text>
                    <TextInput
                        ref={newPasswordRef}
                        style={styles.input}
                        placeholder="Nhập mật khẩu mới"
                        secureTextEntry={!showNewPassword}
                        right={
                            <TextInput.Icon
                                icon={showNewPassword ? "eye-off" : "eye"}
                                onPress={() => setShowNewPassword(prev => !prev)}
                            />
                        }
                        value={newPassword}
                        onChangeText={setNewPassword}
                        returnKeyType="next"
                        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    />

                    <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                    <TextInput
                        ref={confirmPasswordRef}
                        style={styles.input}
                        placeholder="Nhập lại mật khẩu mới"
                        secureTextEntry={!showConfirmPassword}
                        right={
                            <TextInput.Icon
                                icon={showConfirmPassword ? "eye-off" : "eye"}
                                onPress={() => setShowConfirmPassword(prev => !prev)}
                            />
                        }
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        returnKeyType="done"
                    />

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => nav.goBack()}
                            disabled={loading}
                        >
                            <Text style={styles.cancelText}>Huỷ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.updateButton, loading && styles.disabledButton]}
                            onPress={changePassword}
                            disabled={loading}
                        >
                            <Text style={styles.updateText}>Cập nhật</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

export default ChangePassword;
