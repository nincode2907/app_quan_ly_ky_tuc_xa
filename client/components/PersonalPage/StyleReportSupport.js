import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#DEDEDE',
        height: 770,
    },

    chipContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 16,
    },

    chip: {
        backgroundColor: '#E3E3E3',
    },

    list: {
        marginTop: 10,
    },

    reportItem: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#F5F5F5',
        marginBottom: 8,
        borderRadius: 5,
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,

    },

    reportItemType: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: 85
    },

    reportType: {
        fontSize: 13,
        color: '#1E319D'
    },

    reportText: {
        fontSize: 14,
        fontWeight: 'medium'
    },

    reportTime: {
        color: '#ABABAB',
        fontSize: 12,
    },

    chip: {
        backgroundColor: '#E3E3E3',
    },

    chipSelected: {
        borderColor: '#1E319D',
        borderWidth: 1,
    },

    supportButton: {
        backgroundColor: '#1E319D',
        padding: 12,
        marginTop: 'auto',
        borderRadius: 8,
        alignItems: 'center',
    },

    supportButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
