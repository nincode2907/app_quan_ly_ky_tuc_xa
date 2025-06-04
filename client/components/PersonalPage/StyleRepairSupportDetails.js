import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f2f2f2',
    },
    section: {
        backgroundColor: '#fff',
        marginVertical: 8,
        borderRadius: 10,
        paddingBottom: 10,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2C3EAB',
        padding: 10,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    sectionContent: {
        padding: 12,
    },
    text: {
        fontSize: 15,
        fontWeight: 'bold'
    },
    radioGroup: {
        flexDirection: 'row',
        marginVertical: 8,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    radioText: {
        marginLeft: 6,
        fontSize: 14,
    },
    dropdownContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
        overflow: 'hidden',
    },
    picker: {
        height: 52,
        width: '100%',
    },
    pickerItem: {
        fontSize: 14,
    },

    underlineInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 4,
        paddingHorizontal: 2,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 10,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 10,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    label: {
        fontWeight: '600',
        marginBottom: 6,
        fontSize: 15,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    cancelBtn: {
        backgroundColor: '#2C3EAB',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    sendBtn: {
        backgroundColor: '#2C3EAB',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    uploadBtn: {
        backgroundColor: '#DEDEDE',
        padding: 10,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    uploadText: {
        color: '#ABABAB',
        marginLeft: 10,
    },
    uploadedImage: {
        width: '100%',
        height: 200,
        marginTop: 10,
        borderRadius: 10,
    },
});
