import React, { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import Styles from './Style';

const HomeScreen = () => {
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
            navigation.replace("login");
        }, 2000);
    }, []);

    return (
        <View style={Styles.container}>
            <View style={Styles.logoContainer}>
                <Image
                    source={{ uri: 'https://res.cloudinary.com/dywyrpfw7/image/upload/v1744443009/fqc9yrpspqnkvwlk2zek.png' }}
                    style={Styles.logoImg}
                />
            </View>
            <Text style={Styles.subtitle}>Your experience is our experience too</Text>

            {loading && (
                <ActivityIndicator size="large" color="#F5D6B4" style={{ marginTop: 20 }} />
            )}
        </View>
    );
};

export default HomeScreen;
