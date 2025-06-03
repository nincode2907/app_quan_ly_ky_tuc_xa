import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { endpoints } from "../../configs/Apis";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axiosInstance from "../../configs/AxiosInterceptor";
import StylePersonal from './StyleChangePersonal';

const ChangePersonal = ({ route, navigation }) => {
    const {
        phone = '', address = '', gender = '', birthday = '',
        avatar = '', name = '', email = ''
    } = route.params || {};

    const [newName, setNewName] = useState(name);
    const [newEmail, setNewEmail] = useState(email);
    const [newPhone, setNewPhone] = useState(phone);
    const [newAddress, setNewAddress] = useState(address);
    const [newGender, setNewGender] = useState(gender);
    const [newBirthday, setNewBirthday] = useState(birthday);
    const [newAvatar, setNewAvatar] = useState(avatar);
    const [newAvatarBase64, setNewAvatarBase64] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Bạn cần cấp quyền để chọn ảnh.');
            return;
        }

        try {

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.1, // giảm chất lượng
                base64: true, // thêm dòng này để lấy base64 trực tiếp
            });

            if (!result.canceled) {
                const imageUri = result.assets[0].uri;
                const imageBase64 = result.assets[0].base64;

                setNewAvatar(imageUri);
                setNewAvatarBase64(imageBase64);
            }

        } catch (error) {
            console.log("Lỗi khi mở thư viện ảnh:", error);
        }
    };

    const handleUpdate = async () => {
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("phone", newPhone);
            formData.append("gender", newGender === 'Nam' ? 'MALE' : 'FEMALE');
            formData.append("home_town", newAddress);
            formData.append("date_of_birth", newBirthday);
            formData.append("student_id", "SV00001");

            if (newAvatar && !newAvatar.startsWith("http")) {
                const filename = newAvatar.split('/').pop();

                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

                // Đảm bảo uri có tiền tố file://
                const fileUri = newAvatar.startsWith('file://') ? newAvatar : `file://${newAvatar}`;

                formData.append("avatar", {
                    uri: fileUri,
                    name: filename,
                    type: type,
                });
            }


            // Log FormData để kiểm tra
            for (let [key, value] of formData._parts) {
                console.log(key, value);
            }

            const res = await axiosInstance.post(endpoints["updateProfile"], formData, {

            });

            console.log("Cập nhật thành công:", res.data);
            alert("Cập nhật thành công!");
            navigation.goBack();

        } catch (e) {
            console.log("Lỗi cập nhật:", e);
            console.log("Response data:", e.response?.data);
            alert(`Lỗi: ${e.response?.data?.error || e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={StylePersonal.container}>
                        <View style={StylePersonal.avatarContainer}>
                            <TouchableOpacity onPress={pickImage}>
                                <Image source={{ uri: newAvatar }} style={StylePersonal.avatar} />
                            </TouchableOpacity>
                            <Text style={StylePersonal.name}>{newName}</Text>
                            <View style={StylePersonal.divider} />
                        </View>

                        <View style={StylePersonal.infoBox}>
                            <Text style={StylePersonal.label}>Số điện thoại</Text>
                            <TextInput
                                style={StylePersonal.input}
                                placeholder="Nhập số điện thoại"
                                value={newPhone}
                                onChangeText={setNewPhone}
                                keyboardType="phone-pad"
                            />
                            <Text style={StylePersonal.label}>Quê quán</Text>
                            <TextInput
                                style={StylePersonal.input}
                                placeholder="Nhập quê quán"
                                value={newAddress}
                                onChangeText={setNewAddress}
                            />
                            <Text style={StylePersonal.label}>Ngày sinh</Text>
                            <TextInput
                                style={StylePersonal.input}
                                placeholder="YYYY-MM-DD"
                                value={newBirthday}
                                onChangeText={setNewBirthday}
                            />
                        </View>

                        <View style={StylePersonal.buttonContainer}>
                            <TouchableOpacity onPress={handleCancel}>
                                <View style={StylePersonal.cancelButton}>
                                    <Text style={StylePersonal.cancelText}>Hủy</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[StylePersonal.updateButton, loading && StylePersonal.disabledButton]}
                                onPress={handleUpdate}
                                disabled={loading}
                            >
                                <Text style={StylePersonal.updateText}>
                                    {loading ? "Đang cập nhật..." : "Cập nhật"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default ChangePersonal;
