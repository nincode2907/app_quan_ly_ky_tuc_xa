import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StylePersonal from './StyleChangePersonal';

const ChangePersonal = ({ route, navigation }) => {
    const { name, email, gender, birthday } = route.params;

    const [newName, setNewName] = useState(name);
    const [newEmail, setNewEmail] = useState(email);
    const [newGender, setNewGender] = useState(gender);
    const [newBirthday, setNewBirthday] = useState(birthday);

    const handleUpdate = () => {
        // TODO
        navigation.goBack();
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    return (
        <View style={StylePersonal.container}>
            <View style={StylePersonal.infoBox}>
                <Text style={StylePersonal.label}>Tên hiển thị</Text>
                <TextInput
                    style={StylePersonal.input}
                    placeholder="Nhập tên..."
                    value={newName}
                    onChangeText={setNewName}
                />
                <Text style={StylePersonal.label}>Thông tin cá nhân</Text>
                <TextInput
                    style={StylePersonal.input}
                    placeholder="Email"
                    value={newEmail}
                    onChangeText={setNewEmail}
                />
                
                <Text style={StylePersonal.label}>Giới tính</Text>
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
                </View>
                <Text style={StylePersonal.label}>Ngày tháng năm sinh</Text>
                <TextInput
                    style={StylePersonal.input}
                    placeholder="Ngày sinh"
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

                <TouchableOpacity onPress={handleUpdate}>
                    <View style={StylePersonal.updateButton}>
                        <Text style={StylePersonal.updateText}>Cập nhật</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ChangePersonal;
