import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Alert,
    StyleSheet, Keyboard, KeyboardAvoidingView, Platform
} from 'react-native';
import Modal from 'react-native-modal';
import { HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { endpoints } from '../../configs/Apis';
import axiosInstance from "../../configs/AxiosInterceptor";
import OTPInput from '../User/OTPInput';
import { API_KEY } from '@env';

const OTP_TIMEOUT = 60;

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpMsg, setOtpMsg] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    const [timer, setTimer] = useState(OTP_TIMEOUT);
    const timerRef = useRef(null);

    const navigation = useNavigation();

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimer(OTP_TIMEOUT);
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

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const gmailRegex = /^[^\s@]+@gmail\.com$/i;
        return emailRegex.test(email) && gmailRegex.test(email);
    };

    const requestOtp = async () => {
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setEmailError('Vui lòng nhập email.');
            return;
        }

        if (!isValidEmail(trimmedEmail)) {
            setEmailError('Vui lòng nhập email Gmail hợp lệ (ví dụ: abc@gmail.com).');
            return;
        }

        setEmailError('');
        Keyboard.dismiss();
        setLoading(true);

        try {
            await axiosInstance.post(endpoints.requestOtp, { email: trimmedEmail }, {
                headers: { 'x-api-key': API_KEY }
            });

            setIsModalVisible(true);
            startTimer();
            Alert.alert('Thành công', 'Mã OTP đã được gửi đến email của bạn.');
        } catch (error) {
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            } else if (error.request) {
                console.error('Request error:', error.request);
            } else {
                console.error('Error message:', error.message);
            }
            Alert.alert('Lỗi', 'Không thể gửi mã OTP. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        if (!otp) {
            setOtpMsg('Vui lòng nhập mã OTP');
            return;
        }

        setOtpMsg('');
        setOtpLoading(true);

        try {
            const res = await axiosInstance.post(endpoints.resetPassword, {
                otp,
                email: email.trim()
            });

            Alert.alert(
                'Thành công',
                res.data.message || 'Mật khẩu mới đã được gửi đến email. Vui lòng kiểm tra và đăng nhập.',
                [
                    {
                        text: 'Đăng nhập',
                        onPress: () => {
                            setIsModalVisible(false);
                            navigation.navigate('login');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || 'Mã OTP không hợp lệ hoặc lỗi mạng.';
            Alert.alert('Lỗi', msg);
        } finally {
            setOtpLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.container}>
                <Text style={styles.title}>Quên mật khẩu</Text>

                <TextInput
                    placeholder="Nhập email"
                    value={email}
                    onChangeText={text => {
                        setEmail(text);
                        if (emailError) setEmailError('');
                    }}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {!!emailError && <HelperText type="error">{emailError}</HelperText>}

                <TouchableOpacity
                    onPress={requestOtp}
                    style={[styles.button, loading && styles.disabledButton]}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
                    </Text>
                </TouchableOpacity>

                <Modal isVisible={isModalVisible} onBackdropPress={() => !otpLoading && setIsModalVisible(false)}>
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
                                <TouchableOpacity
                                    onPress={() => {
                                        requestOtp();
                                    }}
                                >
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
                                onPress={verifyOtp}
                                disabled={otpLoading}
                            >
                                <Text style={styles.updateText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 220,
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 25,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    button: {
        backgroundColor: '#1E319D',
        paddingVertical: 14,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.6,
    },
    modalContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    otpInfoRow: {
        alignItems: 'center',
        marginTop: 10,
    },
    resendOtpText: {
        color: '#1E319D',
        fontWeight: 'bold',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 5,
        backgroundColor: '#ccc',
    },
    cancelText: {
        fontWeight: 'bold',
    },
    updateButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 5,
        backgroundColor: '#1E319D',
    },
    updateText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ForgotPassword;
