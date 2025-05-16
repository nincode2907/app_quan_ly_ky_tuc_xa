import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MyDispatchContext } from '../../contexts/Contexts';
import AsyncStorage from "@react-native-async-storage/async-storage";
import StylePersonal from './StylePersonal';

const HomePersonal = () => {
    const nav = useNavigation();
    const [modalVisible, setModalVisible] = useState(false);
    const dispatch = useContext(MyDispatchContext);

    const userInfo = {
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@ou.edu.vn',
        pwd: '*********',
        gender: 'Nam',
        birthday: '20 tháng 8 năm 2003',
        avatar: 'https://res.cloudinary.com/dywyrpfw7/image/upload/v1744530660/a22aahwkjiwomfmvvmaj.png',
    };

    const handleNavigateToChangePersonal = () => {
        nav.navigate("changePersonal", {
            name: userInfo.name,
            email: userInfo.email,
            gender: userInfo.gender,
            birthday: userInfo.birthday,
        });
    };

    const logout = async () => {
        setModalVisible(false);
        await AsyncStorage.removeItem('token'); 
        dispatch({ type: "logout" });
        nav.navigate('login');
    };

    return (
        <View style={StylePersonal.container}>
            <View style={StylePersonal.header}>
                <View style={StylePersonal.headerLeft}>
                    <TouchableOpacity onPress={() => nav.goBack()}>
                        <Ionicons name="arrow-back" style={StylePersonal.headerIconLeft} />
                    </TouchableOpacity>
                    <Text style={StylePersonal.headerText}> Thông tin tài khoản</Text>
                </View>

                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Ionicons name="ellipsis-vertical" style={StylePersonal.headerRight} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={StylePersonal.scroll}>
                <View style={StylePersonal.avatarContainer}>
                    <Image source={{ uri: userInfo.avatar }} style={StylePersonal.avatar} />
                    <Text style={StylePersonal.name}>{userInfo.name}</Text>
                    <View style={StylePersonal.divider} />
                </View>

                <View style={StylePersonal.infoBox}>
                    <InfoRow label="Email trường:" value={userInfo.email} />
                    <InfoRow label="Mật khẩu:" value={userInfo.pwd} />
                    <InfoRow label="Giới tính:" value={userInfo.gender} />
                    <InfoRow label="Ngày sinh:" value={userInfo.birthday} />
                </View>

                <View style={StylePersonal.button}>
                    <TouchableOpacity onPress={handleNavigateToChangePersonal}>
                        <View style={StylePersonal.updateButton}>
                            <Ionicons name="sync-outline" size={18} color="#000" />
                            <Text style={StylePersonal.updateText}>Cập nhật</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={StylePersonal.overlay} onPress={() => setModalVisible(false)}>
                    <View style={StylePersonal.dialog}>
                        <TouchableOpacity onPress={() => nav.navigate("changePassword")}>
                            <Text style={StylePersonal.dialogText}>Đổi mật khẩu</Text>
                        </TouchableOpacity>
                        <View style={StylePersonal.separator} />
                        <TouchableOpacity onPress={logout} mode="contained">
                            <Text style={StylePersonal.dialogLogout}>Đăng xuất</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const InfoRow = ({ label, value }) => (
    <View style={StylePersonal.infoRow}>
        <Text style={StylePersonal.label}>{label}</Text>
        <Text style={StylePersonal.value}>{value}</Text>
    </View>
);

export default HomePersonal;
