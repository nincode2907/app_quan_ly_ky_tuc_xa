import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import Styles from "./Style";
import { useNavigation } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";

const Register = () => {

    const nav = useNavigation();

    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const passwordRef = useRef();
    const confirmRef = useRef();

    const info = [{
        placeholder: 'Email',
        field: 'email',
        icon: 'account',
        secureTextEntry: false,
        returnKeyType: 'next',
        onSubmitEditing: () => passwordRef.current.focus(),
    }, {
        placeholder: 'Mật khẩu',
        field: 'password',
        icon: 'eye',
        secureTextEntry: true,
        ref: passwordRef,
        returnKeyType: 'next',
        onSubmitEditing: () => confirmRef.current.focus(),
    }, {
        placeholder: 'Xác nhận mật khẩu',
        field: 'confirm',
        icon: 'eye',
        secureTextEntry: true,
        ref: confirmRef,
        returnKeyType: 'done',
    }];


    const setState = (value, field) => {
        setUser({ ...user, [field]: value })
    }

    const validate = () => {
        if (Object.values(user).length == 0) {
            setMsg("Vui lòng nhập thông tin!");
            return false;
        }

        for (let i of info)
            if (user[i.field] === '') {
                setMsg(`Vui lòng nhập ${i.label}!`);
                return false;
            }

        if (user.password && user.password !== user.confirm) {
            setMsg("Mật khẩu không khớp!");
            return false;
        }

        setMsg('');
        return true;
    }

    

    return (
        <ScrollView>
            <View style={Styles.container}>
                <View style={Styles.logoContainer}>
                    <Image
                        source={{ uri: 'https://res.cloudinary.com/dywyrpfw7/image/upload/v1744446625/caqgikgxawzgzghzgf7x.png' }}
                        style={Styles.logoImg}
                    />
                </View>

                <Text style={Styles.logoText}>Your experience is our experience too</Text>
                <Text style={Styles.loginText}>Tạo tài khoản mới</Text>

                <View style={Styles.form}>

                    <HelperText type="error" visible={msg}>
                        {msg}
                    </HelperText>

                    {info.map(i => (
                        <TextInput
                            key={i.field}
                            style={Styles.inputField}
                            placeholder={i.placeholder}
                            secureTextEntry={
                                i.field === "password" ? !showPassword :
                                    i.field === "confirm" ? !showConfirm : false
                            }
                            right={
                                (i.field === "password" || i.field === "confirm") &&
                                <TextInput.Icon
                                    icon={(
                                        i.field === "password" && showPassword ||
                                        i.field === "confirm" && showConfirm
                                    ) ? "eye-off" : "eye"}
                                    onPress={() => {
                                        if (i.field === "password") setShowPassword(prev => !prev);
                                        if (i.field === "confirm") setShowConfirm(prev => !prev);
                                    }}
                                />
                            }
                            value={user[i.field]}
                            onChangeText={t => setState(t, i.field)}
                            returnKeyType={i.returnKeyType}
                            onSubmitEditing={i.onSubmitEditing}
                            ref={i.ref} 
                        />
                    ))}


                    <Button
                        disabled={loading}
                        loading={loading}
                        mode="contained"
                        style={Styles.loginButton}
                        contentStyle={{ height: 50 }}
                        labelStyle={Styles.loginButtonText}
                    >
                        Đăng ký
                    </Button>

                </View>

                <View style={Styles.googleLogin}>
                    <Text style={Styles.googleLoginText}>hoặc đăng ký với</Text>
                    <TouchableOpacity style={Styles.googleButton}>
                        <Image
                            source={{
                                uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1744450866/gcggw9a3lkq6utrlisef.png",
                            }}
                            style={Styles.googleImg}
                        />
                        <Text>Google</Text>
                    </TouchableOpacity>
                </View>

                <View style={Styles.signupContainer}>
                    <Text style={Styles.signupPrompt}>Bạn đã có tài khoản?</Text>
                    <TouchableOpacity onPress={() => nav.navigate("login")}>
                        <Text style={Styles.signupLink}> Đăng nhập </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>

    );
};

export default Register;
