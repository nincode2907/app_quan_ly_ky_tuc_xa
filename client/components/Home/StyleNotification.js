import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: 5,
    },
    notificationIntro: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    notificationIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    notificationIntroText: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        flexWrap: "wrap",
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    chapter: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 16,
    },
    article: {
        fontSize: 14,
        lineHeight: 22,
    },
});
