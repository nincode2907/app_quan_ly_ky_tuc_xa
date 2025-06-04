import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        padding: 20,
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        alignItems: 'center',
        backgroundColor: '#1E319D',
        paddingVertical: 24,
        borderRadius: 12,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FFF',
    },
    name: {
        color: '#E3C7A5',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 12,
    },
    divider: {
        width: '50%',
        height: 1,
        backgroundColor: '#E3C7A5',
        marginTop: 12,
    },
    infoBox: {
        marginTop: 20,
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        fontWeight: 'bold',
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1.5,
        borderRadius: 10,
        paddingLeft: 15,
        marginBottom: 15,
        backgroundColor: '#fff',
        fontSize: 15,
        color: '#333',
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    radioText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    cancelButton: {
        backgroundColor: '#ccc',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cancelText: {
        color: '#000',
        fontSize: 14,
        fontWeight: 'bold',
    },
    updateButton: {
        backgroundColor: '#1E319D',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    updateText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
});
