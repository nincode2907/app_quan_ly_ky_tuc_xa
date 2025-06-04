import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import { TextInput, HelperText } from 'react-native-paper';
import { endpoints } from "../../configs/Apis";
import axiosInstance from "../../configs/AxiosInterceptor";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OTPInput from '../User/OTPInput';
import { API_KEY } from '@env';
import styles from './StyleChangePassword';

const OTP_TIMEOUT = 60;

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

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpMsg, setOtpMsg] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    const [isFirstLogin, setIsFirstLogin] = useState(false);

    const [timer, setTimer] = useState(OTP_TIMEOUT);
    const timerRef = useRef(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) return;

                const res = await axiosInstance.get(endpoints.user_me);

                if (res && res.data) {
                    setIsFirstLogin(res.data.is_first_login || false);
                }
            } catch (error) {
                console.error('Lỗi khi lấy thông tin user:', error);
            }
        };

        fetchUserInfo();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const validate = () => {
        if (!newPassword || !confirmPassword) {
            setMsg("Vui lòng điền đầy đủ thông tin");
            return false;
        }

        if (newPassword !== confirmPassword) {
            setMsg("Mật khẩu xác nhận không khớp");
            return false;
        }

        if (!isFirstLogin && oldPassword === newPassword) {
            setMsg("Mật khẩu mới không được trùng với mật khẩu cũ");
            return false;
        }

        if (newPassword.length < 6) {
            setMsg("Mật khẩu phải có ít nhất 6 ký tự");
            return false;
        }

        setMsg('');
        return true;
    };

    const getEmailFromUserInfo = async (token) => {
        try {
            const res = await axiosInstance.get(endpoints.user_me);
            return res.data.email;
        } catch (error) {
            console.error('Lỗi khi lấy email user:', error);
            return null;
        }
    };

    const requestOtp = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) throw new Error('Không tìm thấy token');

            const email = await getEmailFromUserInfo(token);
            if (!email) throw new Error('Không tìm thấy email');

            await axiosInstance.post(endpoints.requestOtp, { email }, {
                headers: { 'x-api-key': API_KEY }
            });

            Alert.alert('Thông báo', 'Mã OTP đã được gửi đến email của bạn.');
            setTimer(OTP_TIMEOUT);
            startTimer();
        } catch (error) {
            console.error(error);
            Alert.alert('Lỗi', 'Không thể gửi mã OTP. Vui lòng thử lại.');
        }
    };

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

    const verifyOtpAndChangePassword = async () => {
        if (!otp) {
            setOtpMsg('Vui lòng nhập mã OTP');
            return;
        }

        setOtpMsg('');
        setOtpLoading(true);

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) throw new Error('Không tìm thấy token');

            const email = await getEmailFromUserInfo(token);
            if (!email) throw new Error('Không tìm thấy email');

            await axiosInstance.post(endpoints.verifyOtp, { otp, email }, {
                headers: { 'x-api-key': API_KEY }
            });

            const payload = isFirstLogin
                ? { new_password: newPassword }
                : { old_password: oldPassword, new_password: newPassword };

            await axiosInstance.post(endpoints.changePassword, payload, {
                headers: { 'x-api-key': API_KEY }
            });

            Alert.alert('Thành công', 'Mật khẩu đã được cập nhật', [
                {
                    text: 'OK',
                    onPress: () => {
                        setIsModalVisible(false);
                        nav.goBack();
                    }
                }
            ]);
        } catch (error) {
            console.error(error);
            setOtpMsg('Mã OTP không hợp lệ hoặc lỗi hệ thống');
        } finally {
            setOtpLoading(false);
        }
    };

    const onUpdatePress = async () => {
        if (!validate()) return;

        if (isFirstLogin) {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('token');
                if (!token) throw new Error('Không tìm thấy token');

                await axiosInstance.post(endpoints.changePassword, { new_password: newPassword }, {
                    headers: { 'x-api-key': API_KEY }
                });

                Alert.alert('Thành công', 'Mật khẩu đã được cập nhật', [
                    {
                        text: 'OK',
                        onPress: () => nav.goBack()
                    }
                ]);
            } catch (error) {
                console.error(error);
                Alert.alert('Lỗi', 'Không thể đổi mật khẩu. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        } else {
            setOtp('');
            setOtpMsg('');
            setIsModalVisible(true);
            requestOtp();
        }
    };


    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.form}>
                <HelperText type="error" visible={!!msg}>
                    {msg}
                </HelperText>

                {!isFirstLogin && (
                    <>
                        <Text style={styles.label}>Mật khẩu cũ</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập mật khẩu cũ"
                            secureTextEntry={!showOldPassword}
                            right={<TextInput.Icon icon={showOldPassword ? "eye-off" : "eye"} onPress={() => setShowOldPassword(!showOldPassword)} />}
                            value={oldPassword}
                            onChangeText={setOldPassword}
                            returnKeyType="next"
                            onSubmitEditing={() => newPasswordRef.current?.focus()}
                        />
                    </>
                )}

                <Text style={styles.label}>Mật khẩu mới</Text>
                <TextInput
                    ref={newPasswordRef}
                    style={styles.input}
                    placeholder="Nhập mật khẩu mới"
                    secureTextEntry={!showNewPassword}
                    right={<TextInput.Icon icon={showNewPassword ? "eye-off" : "eye"} onPress={() => setShowNewPassword(!showNewPassword)} />}
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
                    right={<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
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

            <Modal isVisible={isModalVisible}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Nhập mã OTP</Text>

                    <OTPInput
                        value={otp}
                        onChange={setOtp}
                    />

                    {!!otpMsg && <HelperText type="error">{otpMsg}</HelperText>}

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

        </ScrollView>
    );
};

export default ChangePassword;
