import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { endpoints } from '../../configs/Apis';
import axiosInstance from "../../configs/AxiosInterceptor";
import styles from './StyleRepairSupportDetails';

const ReportSupportDetail = () => {
    const nav = useNavigation();
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);

    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [roomNumber, setRoomNumber] = useState('');

    const [selectedIssue, setSelectedIssue] = useState('');
    const [description, setDescription] = useState('');
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);

    const getStudentInfo = async () => {
        try {
            const res = await axiosInstance.get(endpoints['studentInfo']);
            const student = res.data;

            const info = {
                name: student.full_name,
                student_id: student.student_id,
                phone: student.user.phone,
                email: student.user.email,
                room: student.room ? `${student.room.number}` : 'Chưa có',
            };

            setUserInfo(info);
            setName(info.name);
            setStudentId(info.student_id);
            setPhone(info.phone);
            setEmail(info.email);
            setRoomNumber(info.room);
        } catch (err) {
            console.error("Lỗi khi lấy thông tin sinh viên:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getStudentInfo();
    }, []);

    useEffect(() => {
        if (userInfo) {
            setName(userInfo.name || '');
            setStudentId(userInfo.student_id || '');
            setPhone(userInfo.phone || '');
            setEmail(userInfo.email || '');
            if (userInfo.room) {
                setRoomNumber(userInfo.room);
            }
        }
    }, [userInfo]);

    const handleSubmit = async () => {
        if (!selectedIssue || !description) {
            Alert.alert('Lỗi', 'Vui lòng chọn loại yêu cầu và nhập mô tả.');
            return;
        }
        if (!title.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề cho sự cố.');
            return;
        }

        try {
            const requestData = {
                report_type: selectedIssue,
                description: description,
                title: title,
            };

            console.log("Gửi requestData:", requestData);

            await axiosInstance.post(endpoints['issueReport'], requestData);

            Alert.alert('Thành công', 'Yêu cầu của bạn đã được gửi!');
            nav.goBack();
        } catch (error) {
            console.error("Lỗi gửi yêu cầu:", error.response?.data || error.message);
            Alert.alert('Lỗi', 'Không thể gửi yêu cầu. Vui lòng thử lại sau.');
        }
    };




    if (loading) return <Text style={{ padding: 20 }}>Đang tải thông tin...</Text>;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={80}
        >
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                        <Ionicons name="person" size={14} color="#fff" />
                    </View>
                    <View style={styles.sectionContent}>
                        <Text style={styles.text}>Họ và tên:</Text>
                        <TextInput style={styles.input} value={name} onChangeText={setName} />
                        <Text style={styles.text}>Mã số sinh viên:</Text>
                        <TextInput style={styles.input} value={studentId} onChangeText={setStudentId} />
                        <Text style={styles.text}>Số điện thoại:</Text>
                        <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                        <Text style={styles.text}>Email trường:</Text>
                        <TextInput style={styles.input} keyboardType="email-address" value={email} onChangeText={setEmail} />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Thông tin phòng</Text>
                        <Ionicons name="home" size={14} color="#fff" />
                    </View>
                    <View style={styles.sectionContent}>
                        <Text style={styles.text}>Số phòng:</Text>
                        <TextInput style={styles.input} value={roomNumber} onChangeText={setRoomNumber} />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Dạng sự cố</Text>
                        <Ionicons name="construct" size={14} color="#fff" />
                    </View>
                    <View style={styles.sectionContent}>
                        <Text style={styles.label}>Chọn loại sự cố gặp phải</Text>
                        <View style={styles.dropdownContainer}>
                            <Picker
                                selectedValue={selectedIssue}
                                onValueChange={(value) => setSelectedIssue(value)}
                                style={styles.picker}
                            >
                                <Picker.Item label="─── Chọn dạng sự cố ───" value="" enabled={false} style={styles.pickerItem} />
                                <Picker.Item label="Yêu cầu sửa chữa" value="REPAIR" style={styles.pickerItem} />
                                <Picker.Item label="Báo cáo sự cố" value="ISSUE" style={styles.pickerItem} />
                            </Picker>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Chủ đề</Text>
                        <Ionicons name="chatbox-ellipses" size={14} color="#fff" />
                    </View>
                    <View style={styles.sectionContent}>
                        <Text style={styles.text}>Chủ đề:</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Nhập tiêu đề ngắn cho sự cố..."
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Chi tiết sự cố</Text>
                        <Ionicons name="calendar" size={14} color="#fff" />
                    </View>
                    <View style={styles.sectionContent}>
                        <Text style={styles.text}>Mô tả chi tiết:</Text>
                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                        <Text style={styles.text}>Ngày bắt đầu sự cố:</Text>
                        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateInput}>
                            <Text>{startDate.toLocaleDateString()}</Text>
                            <Ionicons name="calendar" size={20} color="#000" />
                        </TouchableOpacity>
                        <DatePicker
                            modal
                            open={showStartPicker}
                            date={startDate}
                            mode="date"
                            onConfirm={(date) => {
                                setShowStartPicker(false);
                                setStartDate(date);
                            }}
                            onCancel={() => setShowStartPicker(false)}
                        />
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => nav.goBack()}>
                        <Text style={styles.btnText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSubmit}>
                        <Text style={styles.btnText}>Gửi</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );

};

export default ReportSupportDetail;
