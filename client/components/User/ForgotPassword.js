import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import API, { endpoints } from "../../configs/Apis";
import { API_KEY } from '@env';

const OTP_TIMEOUT = 60;

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const nav = useNavigation();
    const [loading, setLoading] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpMsg, setOtpMsg] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [timer, setTimer] = useState(OTP_TIMEOUT);
    const timerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

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

    const requestOtp = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            Alert.alert('Lỗi', 'Vui lòng nhập email.');
            return;
        }

        setLoading(true);
        try {
            await API.post(endpoints.requestOtp, { email: trimmedEmail }, {
                headers: { 'x-api-key': API_KEY }
            });

            Alert.alert('Thành công', 'Mã OTP đã được gửi đến email của bạn.');
            setTimer(OTP_TIMEOUT);
            startTimer();

        } catch (error) {
            console.error(error);
            Alert.alert('Lỗi', 'Không thể gửi mã OTP. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async () => {
        if (!otp) {
            setOtpMsg('Vui lòng nhập mã OTP');
            return;
        }
        setOtpMsg('');
        setOtpLoading(true);

        try {
            const response = await API.post(endpoints.resetPassword, {
                otp,
                email: email.trim()
            });

            Alert.alert(
                'Thành công',
                response.data.message || 'Mật khẩu mới đã được gửi đến email. Vui lòng kiểm tra và đăng nhập.',
                [
                    {
                        text: 'Đăng nhập',
                        onPress: () => {
                            setIsModalVisible(false);
                            nav.navigate('login');
                        }
                    },
                ]
            );
        } catch (error) {
            console.error(error);
            if (error.response?.data?.error) {
                Alert.alert('Lỗi', error.response.data.error);
            } else {
                Alert.alert('Lỗi', 'Mã OTP không hợp lệ hoặc có lỗi mạng');
            }
        } finally {
            setOtpLoading(false);
        }
    };

    const onUpdatePress = () => {

        setOtp('');
        setOtpMsg('');
        setIsModalVisible(true);
        requestOtp();
    };

    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.title}>Quên mật khẩu</Text>
                <TextInput
                    placeholder="Nhập email"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    onPress={onUpdatePress}
                    style={[styles.button, loading && styles.disabledButton]}
                    disabled={loading}>
                    <Text style={styles.buttonText}>Gửi mã xác thực</Text>
                </TouchableOpacity>
            </View>
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
                        autoFocus
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
                            onPress={verifyOTP}
                            disabled={otpLoading}
                        >
                            <Text style={styles.updateText}>Xác nhận</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 250,
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
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
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#1E319D',
        paddingVertical: 14,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.6,
        backgroundColor: '#ccc',
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
        marginBottom: 10,
    },
    resendOtpText: {
        color: '#1E319D',
        fontWeight: 'bold',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
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
