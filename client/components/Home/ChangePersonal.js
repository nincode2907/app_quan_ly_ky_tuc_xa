import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { authApis, endpoints } from "../../configs/Apis";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
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
                quality: 1,
                presentationStyle: 'fullScreen',
            });

            if (!result.canceled) {
                setNewAvatar(result.assets[0].uri);
            }
        } catch (error) {
            console.log("Lỗi khi mở thư viện ảnh:", error);
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const genderValue = newGender === 'Nam' ? 'MALE' : newGender === 'Nữ' ? 'FEMALE' : 'OTHER';

            const formData = new FormData();
            formData.append("phone", newPhone);
            formData.append("gender", genderValue);
            formData.append("home_town", newAddress);
            formData.append("date_of_birth", newBirthday);
            formData.append("student_id", "SV00001");

            if (newAvatar && !newAvatar.startsWith("http")) {
                const fileName = newAvatar.split("/").pop();
                const fileType = fileName.split(".").pop();
                formData.append("avatar", {
                    uri: newAvatar,
                    name: fileName,
                    type: `image/${fileType}`,
                });
            }

            const res = await authApis(token).post(endpoints["updateProfile"], formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.status === 200) {
                Alert.alert("Thông báo", "Cập nhật thông tin thành công");
                navigation.goBack();
            } else {
                alert("Cập nhật thất bại. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            alert("Đã xảy ra lỗi trong quá trình cập nhật.");
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

{/* <Text style={StylePersonal.label}>Giới tính</Text>
                <View style={StylePersonal.genderContainer}>
                    <TouchableOpacity
                        onPress={() => setNewGender('Nam')}
                        style={StylePersonal.radioButton}>
                        <Ionicons
                            name={newGender === 'Nam' ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color={newGender === 'Nam' ? '#1E319D' : '#ccc'}
                        />
                        <Text style={StylePersonal.radioText}>Nam</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setNewGender('Nữ')}
                        style={StylePersonal.radioButton}>
                        <Ionicons
                            name={newGender === 'Nữ' ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color={newGender === 'Nữ' ? '#1E319D' : '#ccc'}
                        />
                        <Text style={StylePersonal.radioText}>Nữ</Text>
                    </TouchableOpacity>
                </View> */}