import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CLIENT_ID, CLIENT_SECRET } from '@env';
import Styles from "./Style";

const Login = () => {
    const nav = useNavigation();
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const passwordRef = useRef();

    const info = [
        {
            label: 'Tên đăng nhập',
            placeholder: 'Email',
            field: 'username',
            icon: 'account',
            secureTextEntry: false,
            returnKeyType: 'next',
            onSubmitEditing: () => passwordRef.current?.focus(),
        },
        {
            label: 'Mật khẩu',
            placeholder: 'Mật khẩu',
            field: 'password',
            icon: 'eye',
            secureTextEntry: true,
            ref: passwordRef,
            returnKeyType: 'done',
        }
    ];

    const setState = (value, field) => {
        setUser({ ...user, [field]: value });
    };

    const validate = () => {
        if (Object.values(user).length === 0) {
            setMsg("Vui lòng nhập thông tin!");
            return false;
        }

        for (let i of info) {
            if (!user[i.field]) {
                setMsg(`Vui lòng nhập ${i.label}!`);
                return false;
            }
        }

        setMsg('');
        return true;
    };

    const login = async () => {
        if (!validate()) return;

        try {
            setLoading(true);

            const data = {
                username: user.username,
                password: user.password,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "password"
            };

            const res = await Apis.post(endpoints['login'], data, {
                headers: { 'Content-Type': 'application/json' }
            });

            const token = res.data.access_token;
            await AsyncStorage.setItem('token', token);

            const userRes = await Apis.get(endpoints['user_me'], {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const isFirstLogin = userRes.data.is_first_login;

            if (isFirstLogin) {
                nav.navigate("changePassword");
            } else {
                nav.navigate("MainTabs");
            }

        } catch (ex) {
            console.error("Login error:", ex.response?.data || ex.message);
            setMsg("Sai thông tin đăng nhập hoặc lỗi máy chủ!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView ontentContainerStyle={{ flexGrow: 1 }}>
            <View style={Styles.container}>
                <View style={Styles.logoContainer}>
                    <Image
                        source={{ uri: 'https://res.cloudinary.com/dywyrpfw7/image/upload/v1744446625/caqgikgxawzgzghzgf7x.png' }}
                        style={Styles.logoImg}
                    />
                </View>
                <Text style={Styles.logoText}>Your experience is our experience too</Text>
                <Text style={Styles.loginText}>Đăng nhập vào tài khoản</Text>

                <View style={Styles.form}>
                    <HelperText type="error" visible={!!msg}>
                        {msg}
                    </HelperText>

                    {info.map(i => (
                        <TextInput
                            key={i.field}
                            style={Styles.inputField}
                            placeholder={i.placeholder}
                            secureTextEntry={i.secureTextEntry && !showPassword}
                            right={
                                i.field === "password" && (
                                    <TextInput.Icon
                                        icon={showPassword ? "eye-off" : "eye"}
                                        onPress={() => setShowPassword(prev => !prev)}
                                    />
                                )
                            }
                            value={user[i.field]}
                            onChangeText={t => setState(t, i.field)}
                            returnKeyType={i.returnKeyType}
                            onSubmitEditing={i.onSubmitEditing}
                            {...(i.ref ? { ref: i.ref } : {})}
                        />
                    ))}

                    <Button
                        onPress={login}
                        disabled={loading}
                        loading={loading}
                        mode="contained"
                        style={Styles.loginButton}
                        contentStyle={{ height: 50 }}
                        labelStyle={Styles.loginButtonText}
                    >
                        Đăng nhập
                    </Button>
                </View>


                <View style={Styles.googleLogin}>
                    <Text style={Styles.googleLoginText}>Bạn quên mật khẩu?</Text>
                    <TouchableOpacity style={Styles.googleButton} onPress={() => nav.navigate("forgotPassword")}>
                        <Image
                            source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1745247491/d4kxbpmvarvtvhsnfpea.png" }}
                            style={Styles.googleImg}
                        />
                        <Text>Quên mật khẩu</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </ScrollView>
    );
};

export default Login;
