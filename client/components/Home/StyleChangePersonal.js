import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        padding: 20,
        justifyContent: 'flex-start',
    },
    infoBox: {
        marginBottom: 30,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1.5,
        borderRadius: 10,
        paddingLeft: 15,
        marginBottom: 15,
        backgroundColor: '#fff',
        fontSize: 16,
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
        fontSize: 16,
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
        fontSize: 16,
        fontWeight: 'bold',
    },
});
