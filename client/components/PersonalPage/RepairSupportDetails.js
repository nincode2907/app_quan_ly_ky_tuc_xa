import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import styles from './StyleRepairSupportDetails';

const RepairSupportDetails = () => {
    const nav = useNavigation();
    const [selectedIssue, setSelectedIssue] = useState('');
    const [customIssue, setCustomIssue] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [building, setBuilding] = useState('A');
    const [repair, setRepair] = useState('Cao');

    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [roomNumber, setRoomNumber] = useState('');
    const [reason, setReason] = useState('');
    const [image, setImage] = useState(null);

    const handleSubmit = () => {
        if (!name || !studentId || !phone || !email || !roomNumber || (!selectedIssue && !customIssue)) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc.');
            return;
        }

        const requestData = {
            name,
            studentId,
            phone,
            email,
            building,
            roomNumber,
            issue: selectedIssue === 'other' ? customIssue : selectedIssue,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            reason,
            image,
        };

        console.log('Form data:', requestData);
        Alert.alert('Thành công', 'Thông tin đã được gửi!');
        nav.goBack();
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Quyền bị từ chối", "Bạn cần cho phép ứng dụng truy cập thư viện ảnh.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: [ImagePicker.MediaType.IMAGE],
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled && result.assets.length > 0) {
            setImage(result.assets[0].uri);
        }
    };

    return (
        <ScrollView style={styles.container}>
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

            {/* Thông tin phòng */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Thông tin phòng</Text>
                    <Ionicons name="home" size={14} color="#fff" />
                </View>
                <View style={styles.sectionContent}>
                    <Text style={styles.text}>Tòa nhà:</Text>
                    <View style={styles.radioGroup}>
                        <TouchableOpacity style={styles.radioOption} onPress={() => setBuilding('A')}>
                            <Ionicons name={building === 'A' ? 'radio-button-on' : 'radio-button-off'} size={20} color="#007AFF" />
                            <Text style={styles.radioText}>Khu A</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.radioOption} onPress={() => setBuilding('B')}>
                            <Ionicons name={building === 'B' ? 'radio-button-on' : 'radio-button-off'} size={20} color="#007AFF" />
                            <Text style={styles.radioText}>Khu B</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.text}>Số phòng:</Text>
                    <TextInput style={styles.input} value={roomNumber} onChangeText={setRoomNumber} />
                </View>
            </View>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Danh sách yêu cầu hỗ trợ</Text>
                    <Ionicons name="construct" size={14} color="#fff" />
                </View>
                <View style={styles.sectionContent}>
                    <Text style={styles.label}>Chọn loại sự cố:</Text>
                    <View style={styles.dropdownContainer}>
                        <Picker
                            selectedValue={selectedIssue}
                            onValueChange={(itemValue) => setSelectedIssue(itemValue)}
                            style={[styles.picker, { color: '#000' }]} // ép màu chữ rõ ràng
                        >
                            <Picker.Item label="─── Chọn sự cố ───" value="" enabled={false} />
                            <Picker.Item label="Sự cố nước" value="water" />
                            <Picker.Item label="Sự cố điện" value="electricity" />
                            <Picker.Item label="Khóa cửa, thiết bị" value="lock" />
                            <Picker.Item label="Khác" value="other" />
                        </Picker>
                    </View>

                    {selectedIssue === 'other' && (
                        <>
                            <Text>Khác:</Text>
                            <TextInput
                                style={styles.underlineInput}
                                placeholder="Nhập loại sự cố khác"
                                value={customIssue}
                                onChangeText={setCustomIssue}
                            />
                        </>
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Chi tiết sự cố</Text>
                    <Ionicons name="calendar" size={14} color="#fff" />
                </View>
                <View style={styles.sectionContent}>
                    <Text style={styles.text}>Mô tả chi tiết</Text>
                    <TextInput style={styles.input} value={roomNumber} onChangeText={setRoomNumber} />
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
                    <Text style={styles.text}>Sinh viên chọn mức độ khuẩn cấp của yêu cầu</Text>
                    <View style={styles.radioGroupLevel}>
                        <TouchableOpacity style={styles.radioOption} onPress={() => setRepair('Cao')}>
                            <Ionicons name={repair === 'Cao' ? 'radio-button-on' : 'radio-button-off'} size={20} color="#007AFF" />
                            <Text style={styles.radioText}>Cao (Sự cố nghiêm trọng, cần xử lý ngay)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.radioOption} onPress={() => setRepair('TB')}>
                            <Ionicons name={repair === 'TB' ? 'radio-button-on' : 'radio-button-off'} size={20} color="#007AFF" />
                            <Text style={styles.radioText}>Trung bình (Sự cố ảnh hưởng nhưng vẫn sử dụng được)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.radioOption} onPress={() => setRepair('Thap')}>
                            <Ionicons name={repair === 'Thap' ? 'radio-button-on' : 'radio-button-off'} size={20} color="#007AFF" />
                            <Text style={styles.radioText}>Thấp (Sửa chữa nhỏ, không quá gấp)</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tải hình ảnh minh họa</Text>
                    <Ionicons name="image" size={14} color="#fff" />
                </View>
                <View style={styles.sectionContent}>
                    <Text style={styles.label}>Chọn ảnh để ban quản lý dễ kiểm tra hơn.</Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                        <Ionicons name="image-outline" size={20} color="#ABABAB" />
                        <Text style={styles.uploadText}>Chọn ảnh từ thư viện</Text>
                    </TouchableOpacity>

                    {image && (
                        <Image source={{ uri: image }} style={styles.uploadedImage} />
                    )}
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
    );
};

export default RepairSupportDetails;
