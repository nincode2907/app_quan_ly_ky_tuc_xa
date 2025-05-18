import { StyleSheet } from 'react-native';
export default StyleSheet.create({
    form: {
        padding: 20,
    },

    label: {
        fontSize: 16,
        marginBottom: 5,
        color: '#333',
        fontWeight: 'bold',
    },

    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: '#DEDEDE'
    },

    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,

    },

    cancelButton: {
        backgroundColor: '#ccc',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },

    cancelText: {
        color: '#000',
        fontWeight: 'bold',
    },

    updateButton: {
        backgroundColor: '#1E319D',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },

    updateText: {
        color: '#fff',
        fontWeight: 'bold',
    },

    disabledButton: {
        opacity: 0.6,
        backgroundColor: '#ccc',
    },

    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    otpInfoRow: {
        marginVertical: 10,
        alignItems: 'center',
    },

    resendOtpText: {
        color: 'blue',
        textDecorationLine: 'underline',
    },
});