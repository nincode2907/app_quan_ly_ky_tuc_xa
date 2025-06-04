import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#DEDEDE',
    },
    roomImage: {
        width: '100%',
        height: 250,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    infoContainer: {
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    roomName: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 10,
        flex: 1,
        flexWrap: 'wrap',
    },
    roomPrice: {
        fontSize: 16,
        color: '#E10000',
        fontWeight: '600',
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 10,
        fontSize: 15,
        color: '#B0B0B0',
    },
    title: {
        marginTop: 10,
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
    },
    description: {
        marginTop: 10,
        fontSize: 15,
        lineHeight: 22,
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#DEDEDE',
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 30,
        backgroundColor: '#1E319D',
        borderRadius: 15,
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
});
