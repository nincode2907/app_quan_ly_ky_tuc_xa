import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { useNavigation } from '@react-navigation/native';
import styles from './StyleExtensionsNoticeOfAbsence';

const ExtensionsNoticeOfAbsence = () => {

    const nav = useNavigation();
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [building, setBuilding] = useState('A');

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                    <Ionicons name="alert-circle" size={14} color="red" />
                </View>
                <View style={styles.sectionContent}>
                    <Text>Họ và tên:</Text>
                    <TextInput style={styles.input} />
                    <Text>Mã số sinh viên:</Text>
                    <TextInput style={styles.input} />
                    <Text>Lớp:</Text>
                    <TextInput style={styles.input} />
                    <Text>Khoa:</Text>
                    <TextInput style={styles.input} />
                    <Text>Số điện thoại:</Text>
                    <TextInput style={styles.input} />
                    <Text>Email trường:</Text>
                    <TextInput style={styles.input} />
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Thông tin phòng</Text>
                    <Ionicons name="alert-circle" size={14} color="red" />
                </View>
                <View style={styles.sectionContent}>
                    <Text>Tòa nhà:</Text>
                    <View style={styles.radioGroup}>
                        <TouchableOpacity style={styles.radioOption} onPress={() => setBuilding('A')}>
                            <Ionicons
                                name={building === 'A' ? 'radio-button-on' : 'radio-button-off'}
                                size={20}
                                color="#007AFF"
                            />
                            <Text style={styles.radioText}>Khu A</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.radioOption} onPress={() => setBuilding('B')}>
                            <Ionicons
                                name={building === 'B' ? 'radio-button-on' : 'radio-button-off'}
                                size={20}
                                color="#007AFF"
                            />
                            <Text style={styles.radioText}>Khu B</Text>
                        </TouchableOpacity>
                    </View>
                    <Text>Số phòng:</Text>
                    <TextInput style={styles.input} />
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Thời gian vắng mặt</Text>
                    <Ionicons name="alert-circle" size={14} color="red" />
                </View>
                <View style={styles.sectionContent}>
                    <Text>Ngày bắt đầu:</Text>
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

                    <Text>Ngày kết thúc:</Text>
                    <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateInput}>
                        <Text>{endDate.toLocaleDateString()}</Text>
                        <Ionicons name="calendar" size={20} color="#000" />
                    </TouchableOpacity>
                    <DatePicker
                        modal
                        open={showEndPicker}
                        date={endDate}
                        mode="date"
                        onConfirm={(date) => {
                            setShowEndPicker(false);
                            setEndDate(date);
                        }}
                        onCancel={() => setShowEndPicker(false)}
                    />

                    <Text>Lý do vắng mặt:</Text>
                    <TextInput style={styles.input} />
                </View>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => nav.goBack()}>
                    <Text style={styles.btnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendBtn}>
                    <Text style={styles.btnText}>Gửi</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default ExtensionsNoticeOfAbsence;
