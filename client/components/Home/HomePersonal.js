import React, { useState, useEffect, useContext } from 'react';
import { useRoute } from '@react-navigation/native';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MyDispatchContext } from '../../contexts/Contexts';
import { endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../../configs/AxiosInterceptor";
import StylePersonal from './StylePersonal';

const HomePersonal = () => {
    const nav = useNavigation();
    const route = useRoute();

    const [modalVisible, setModalVisible] = useState(false);
    const dispatch = useContext(MyDispatchContext);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getStudentInfo = async () => {
        try {
            const res = await axiosInstance.get(endpoints['studentInfo']);
            const student = res.data;

            setUserInfo({
                name: student.full_name,
                address: student.home_town,
                email: student.user.email,
                phone: student.user.phone,
                pwd: '*********',
                gender: student.gender === 'male' ? 'Nam' : (student.gender === 'female' ? 'Nữ' : 'Khác'),
                birthday: student.date_of_birth,
                avatar: student.user.avatar || 'https://res.cloudinary.com/dywyrpfw7/image/upload/v1744530660/a22aahwkjiwomfmvvmaj.png',
                faculty: student.faculty.name,
                student_id: student.student_id,
                room: student.room,
                is_blocked: student.is_blocked,
            });
        } catch (err) {
            console.error("Lỗi khi lấy thông tin sinh viên:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        getStudentInfo();
    }, []);

    useEffect(() => {
        if (route.params?.newAvatar) {
            setUserInfo(prev => ({ ...prev, avatar: route.params.newAvatar }));
        }
    }, [route.params?.newAvatar]);

    const handleNavigateToChangePersonal = () => {
        if (userInfo) {
            nav.navigate("changePersonal", {
                phone: userInfo.phone,
                address: userInfo.address,
                gender: userInfo.gender,
                birthday: userInfo.birthday,
                avatar: userInfo.avatar,
                name: userInfo.name,
                onUpdateAvatar: (newAvatar) => {
                    setUserInfo(prev => ({ ...prev, avatar: newAvatar }));
                    nav.navigate('Home', { newAvatar });
                }
            });
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await getStudentInfo();  
        setRefreshing(false);
    };



    const logout = async () => {
        setModalVisible(false);
        await AsyncStorage.removeItem('token');
        dispatch({ type: "logout" });
        nav.navigate('login');
    };

    if (loading) {
        return (
            <View style={StylePersonal.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (!userInfo) {
        return (
            <View style={StylePersonal.errorContainer}>
                <Text style={StylePersonal.errorText}>Không thể tải thông tin tài khoản.</Text>
            </View>
        );
    }

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

            <ScrollView contentContainerStyle={StylePersonal.scroll} refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
                <View style={StylePersonal.avatarContainer}>
                    <Image source={{ uri: userInfo.avatar }} style={StylePersonal.avatar} />
                    <Text style={StylePersonal.name}>{userInfo.name}</Text>
                    <View style={StylePersonal.divider} />
                </View>

                <View style={StylePersonal.infoBox}>
                    <InfoRow label="Email trường:" value={userInfo.email} />
                    <InfoRow label="Số điện thoại:" value={userInfo.phone} />
                    <InfoRow label="Địa chỉ:" value={userInfo.address} />
                    <InfoRow label="Mật khẩu:" value={userInfo.pwd} />
                    <InfoRow label="Giới tính:" value={userInfo.gender} />
                    <InfoRow label="Ngày sinh:" value={userInfo.birthday} />
                    <InfoRow label="Khoa:" value={userInfo.faculty} />
                    <InfoRow label="Phòng:" value={userInfo.room ? `${userInfo.room.number}` : 'Chưa có'} />
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
