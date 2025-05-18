import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import { TextInput, HelperText } from 'react-native-paper';
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from './StyleChangePassword';

const OTP_TIMEOUT = 60; // Thời gian đếm ngược (giây)

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

    // OTP modal states
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpMsg, setOtpMsg] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    // Đếm ngược thời gian nhận OTP
    const [timer, setTimer] = useState(OTP_TIMEOUT);
    const timerRef = useRef(null);

    // Hàm validate form trước khi hiện OTP modal
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

    // Gửi yêu cầu tạo OTP lên backend
    const requestOtp = async () => {
        try {
            let token = await AsyncStorage.getItem('token');
            if (!token) throw new Error('Không tìm thấy token');

            await authApis(token).post(endpoints.requestOtp);
            Alert.alert('Thông báo', 'Mã OTP đã được gửi đến email của bạn.');

            setTimer(OTP_TIMEOUT);
            startTimer();
        } catch (error) {
            console.error(error);
            Alert.alert('Lỗi', 'Không thể gửi mã OTP. Vui lòng thử lại.');
        }
    };

    // Bắt đầu đếm ngược thời gian OTP
    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Xác nhận OTP và đổi mật khẩu
    const verifyOtpAndChangePassword = async () => {
        if (!otp) {
            setOtpMsg('Vui lòng nhập mã OTP');
            return;
        }

        setOtpMsg('');
        setOtpLoading(true);

        try {
            let token = await AsyncStorage.getItem('token');
            if (!token) throw new Error('Không tìm thấy token');

            // Gọi API verify OTP
            await authApis(token).post(endpoints.verifyOtp, { otp });

            // Nếu OTP hợp lệ, gọi API đổi mật khẩu
            await authApis(token).post(endpoints.changePassword, {
                old_password: oldPassword,
                new_password: newPassword
            });

            Alert.alert('Thành công', 'Mật khẩu đã được cập nhật');
            setIsModalVisible(false);
            nav.goBack();
        } catch (error) {
            console.error(error);
            setOtpMsg('Mã OTP không hợp lệ hoặc lỗi hệ thống');
        } finally {
            setOtpLoading(false);
        }
    };

    // Khi nhấn cập nhật, validate và hiện modal nhập OTP
    const onUpdatePress = () => {
        if (!validate()) return;

        setOtp('');
        setOtpMsg('');
        setIsModalVisible(true);
        requestOtp();
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
                            onPress={onUpdatePress}
                            disabled={loading}
                        >
                            <Text style={styles.updateText}>Cập nhật</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Modal nhập OTP */}
                <Modal isVisible={isModalVisible}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Nhập mã OTP</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Mã OTP"
                            keyboardType="numeric"
                            value={otp}
                            onChangeText={setOtp}
                            maxLength={6}
                        />
                        {!!otpMsg && <HelperText type="error" visible>{otpMsg}</HelperText>}

                        <View style={styles.otpInfoRow}>
                            {timer > 0 ? (
                                <Text>Vui lòng chờ {timer} giây để gửi lại OTP</Text>
                            ) : (
                                <TouchableOpacity onPress={requestOtp}>
                                    <Text style={styles.resendOtpText}>Gửi lại OTP</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setIsModalVisible(false)}
                                disabled={otpLoading}
                            >
                                <Text style={styles.cancelText}>Huỷ</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.updateButton, otpLoading && styles.disabledButton]}
                                onPress={verifyOtpAndChangePassword}
                                disabled={otpLoading}
                            >
                                <Text style={styles.updateText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </ScrollView>
    );
};

export default ChangePassword;
