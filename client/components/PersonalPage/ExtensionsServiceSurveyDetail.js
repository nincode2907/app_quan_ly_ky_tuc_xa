import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Keyboard,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import axiosInstance from "../../configs/AxiosInterceptor";
import { endpoints } from "../../configs/Apis";
import { RadioButton } from "react-native-paper";
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ExtensionsServiceSurveyDetail = () => {
    const route = useRoute();
    const { surveyId } = route.params;

    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        const fetchSurvey = async () => {
            try {
                const res = await axiosInstance.get(`${endpoints.surveys}${surveyId}/`);
                setSurvey(res.data);

                if (res.data.completed === true) {
                    setCompleted(true);
                }
            } catch (err) {
                console.error("Lỗi khi tải chi tiết khảo sát:", err);
                Alert.alert("Lỗi", "Không thể tải khảo sát. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };
        fetchSurvey();
    }, [surveyId]);

    const handleAnswerChange = (questionId, value) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        if (!survey?.questions || survey.questions.length === 0) {
            Alert.alert("Lỗi", "Khảo sát không có câu hỏi.");
            return;
        }

        const unanswered = survey.questions.filter((q) => {
            const a = answers[q.id];
            return a === undefined || a === null || a === "";
        });

        if (unanswered.length > 0) {
            Alert.alert(
                "Lỗi",
                `Bạn chưa trả lời hết tất cả các câu hỏi. Vui lòng trả lời câu hỏi "${unanswered[0].content}".`
            );
            return;
        }

        const payload = survey.questions.map((q) => {
            if (q.answer_type === "RATING") {
                return {
                    survey: survey.id,
                    question: q.id,
                    rating: parseInt(answers[q.id], 10),
                };
            } else if (q.answer_type === "TEXT") {
                return {
                    survey: survey.id,
                    question: q.id,
                    text_answer: answers[q.id],
                };
            }
            return null;
        }).filter((item) => item !== null);

        setSubmitting(true);
        Keyboard.dismiss();

        try {
            await axiosInstance.post(endpoints.surveyResponses, payload);
            Alert.alert("Thành công", "Bạn đã nộp khảo sát thành công.");
            setCompleted(true);
        } catch (error) {
            console.error("Lỗi khi nộp khảo sát:", error.response?.data || error.message);
            const msg =
                error.response?.data?.detail ||
                JSON.stringify(error.response?.data) ||
                "Nộp khảo sát thất bại. Vui lòng thử lại.";
            Alert.alert("Lỗi", msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !survey) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Đang tải khảo sát...</Text>
            </View>
        );
    }

    if (survey.is_completed) {
        return (
            <View style={[styles.loadingContainer, { padding: 20 }]}>
                <MaterialCommunityIcons
                    name="check"
                    size={60}
                    color="#ABABAB"
                />
                <Text style={{ fontSize: 16, fontWeight: "bold", color: "#ABABAB" }}>
                    Bạn đã hoàn thành khảo sát này
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: "#fff" }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                {completed ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: "bold", textAlign: "center" }}>
                            Bạn đã hoàn thành khảo sát này. Cảm ơn bạn đã tham gia!
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.title}>{survey.title}</Text>
                        <Text style={styles.noteText}>
                            1 - Rất không hài lòng, 2 - Không hài lòng, 3 - Bình thường, 4 - Hài lòng, 5 - Rất hài lòng
                        </Text>
                        {survey.questions.map((q) => (
                            <View key={q.id} style={styles.questionContainer}>
                                <Text style={styles.question}>{q.content}</Text>
                                {q.answer_type === "RATING" ? (
                                    <View style={styles.ratingContainer}>
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <View key={num} style={styles.radioItem}>
                                                <RadioButton
                                                    value={num.toString()}
                                                    status={answers[q.id] === num ? "checked" : "unchecked"}
                                                    onPress={() => handleAnswerChange(q.id, num.toString())}
                                                />
                                                <Text>{num}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nhập ý kiến của bạn"
                                        value={answers[q.id] || ""}
                                        onChangeText={(text) => handleAnswerChange(q.id, text)}
                                        multiline
                                    />
                                )}
                            </View>
                        ))}
                        <TouchableOpacity
                            style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            <Text style={styles.submitButtonText}>
                                {submitting ? "Đang gửi..." : "Nộp khảo sát"}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 5,
    },
    noteText: {
        fontSize: 12,
        fontStyle: "italic",
        marginBottom: 4,
        color: "#666",
    },
    questionContainer: {
        marginBottom: 20,
    },
    question: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    radioItem: {
        alignItems: "center",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 8,
        minHeight: 60,
        textAlignVertical: "top",
    },
    submitButton: {
        backgroundColor: "#1E319D",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 16,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    loadingContainer: {
        alignItems: "center",
        marginTop: 250,
    },
});

export default ExtensionsServiceSurveyDetail;
