import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#DEDEDE",
    },
    header: {
        backgroundColor: "#1E319D",
        alignItems: "center",
        paddingVertical: 50,
        paddingTop: 30,
    },
    logo: {
        width: 170,
        height: 80,
        resizeMode: "contain",
    },
    slogan: {
        color: "#E3C7A5",
        fontSize: 13,
    },
    searchBar: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginTop: -25,
        padding: 12,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    avatar: {
        width: 35,
        height: 35,
        borderRadius: 50,
    },
    rightIcons: {
        flexDirection: "row",
        gap: 5,
        marginRight: 5,
    },
    imgIcon: {
        width: 25,
        height: 25,
        marginLeft: 10,
    },
    titleContainer: {
        backgroundColor: "#1E319D",
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginTop: 10,
    },
    title: {
        color: "#E3C7A5",
        fontWeight: "bold",
        fontSize: 14,
        // borderBottomColor: '#E3C7A5',
    },
    notifications: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    notificationItem: {
        backgroundColor: "#D5D5D5",
        borderRadius: 10,
        padding: 10,
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
    },
    notificationIcon: {
        marginRight: 10,
        fontSize: 20,
    },
    notificationText: {
        fontSize: 13,
        flex: 1,
        flexWrap: "wrap",
    },
    notificationTime: {
        fontSize: 10,
        color: "#ABABAB",
        marginTop: 5,
    },
});
