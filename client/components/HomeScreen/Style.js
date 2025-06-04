import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E319D', 
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    logoImg: {
        width: 250,
        height: 60,
        resizeMode: 'contain',
        marginRight: 4,
    },
    subtitle: {
        color: '#E3C7A5',
        fontSize: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
});