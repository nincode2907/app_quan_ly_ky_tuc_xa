import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: '#fff',
        paddingTop: 100,
    },

    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImg: {
        width: 260,
        height: 80,
        resizeMode: 'contain',
        marginRight: 4,
    },
    logoText: {
        color: '#E3C7A5',
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    loginText: {
        color: '#1E319D',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 60,
        marginLeft: 20,
    },
    form: {
        width: "90%",
        marginLeft: 20,
    },
    inputField: {
        width: "100%",
        height: 50,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: "#DEDEDE",
        borderRadius: 5,
        backgroundColor: "#fff",
    },
    loginButton: {
        backgroundColor: "#1E319D",
        borderRadius: 5,
        marginTop: 20,
    },
    loginButtonText: {
        color: "#E3C7A5",
        fontSize: 15,
        fontWeight: "bold",
    },
    googleLogin: {
        alignItems: "center",
        marginTop: 50,
    },
    googleButton: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#B0B0B0",
        borderRadius: 5,
        padding: 10,
        marginTop: 15,
    },
    googleImg: {
        width: 25,
        height: 25,
        marginRight: 5,
    },
    googleLoginText: {
        color: "#B0B0B0",
        fontSize: 14,
    },
    signupContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "center",
        marginTop: 60,
    },
    signupPrompt: {
        color: '#B0B0B0',
        fontSize: 14,
    },
    signupLink: {
        color: '#1E319D',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
