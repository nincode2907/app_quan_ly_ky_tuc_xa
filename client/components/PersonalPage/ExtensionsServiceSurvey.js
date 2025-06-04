import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import { Chip } from "react-native-paper";
import axiosInstance from "../../configs/AxiosInterceptor";
import { endpoints } from "../../configs/Apis";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const ExtensionsServiceSurvey = () => {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchSurveys = async () => {
            try {
                const res = await axiosInstance.get(endpoints.surveys);
                setSurveys(res.data.results);
            } catch (error) {
                console.error("Lỗi khi tải khảo sát:", error.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSurveys();
    }, []);

    const filteredSurveys = selectedFilter === null
        ? surveys
        : surveys.filter(item => item.is_completed === selectedFilter);

    const renderSurvey = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate("extensionsServiceSurveyDetail", { surveyId: item.id })}>
            <View style={styles.card}>
                <View style={styles.row}>
                    <View style={styles.iconContainer}>
                        <View style={styles.circleIcon}>
                            <MaterialCommunityIcons
                                name="clipboard-list-outline"
                                size={24}
                                color="#333"
                            />
                        </View>
                        <Text
                            style={[
                                styles.status,
                                { color: item.is_completed ? "#2e7d32" : "#d32f2f" },
                            ]}
                        >
                            {item.is_completed ? "Completed" : "Unfinished"}
                        </Text>
                    </View>
                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.date}>
                            Kết thúc: {new Date(item.end_date).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.chipRow}>
                <Chip
                    icon="close-circle-outline"
                    selected={selectedFilter === false}
                    onPress={() => setSelectedFilter(false)}
                    style={[
                        styles.chip,
                        selectedFilter === false && styles.chipSelected
                    ]}
                >
                    Chưa hoàn thành
                </Chip>
                <Chip
                    icon="check-circle-outline"
                    selected={selectedFilter === true}
                    onPress={() => setSelectedFilter(true)}
                    style={[
                        styles.chip,
                        selectedFilter === true && styles.chipSelected
                    ]}
                >
                    Đã hoàn thành
                </Chip>
            </View>
            <FlatList
                data={filteredSurveys}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderSurvey}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#f2f2f2",
        flex: 1,
    },
    chipRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 12,
        justifyContent: "center",
    },
    chip: {
        backgroundColor: "#e0e0e0",
    },
    chipSelected: {
        borderColor: '#1E319D',
        borderWidth: 1,
    },
    card: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    circleIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "#e0e0e0",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
    },
    iconContainer: {
        alignItems: "center",
        width: 80,
    },
    status: {
        fontSize: 10,
        fontWeight: "600",
    },
    contentContainer: {
        marginLeft: 12,
        gap: 5,
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#222",
        flexShrink: 1,
    },
    date: {
        fontSize: 13,
        color: "#666",
    },
});

export default ExtensionsServiceSurvey;
