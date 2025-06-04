import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#DEDEDE',
    },

    section: {
        backgroundColor: '#fff',
        padding: 16,
    },

    infoButton: {
        backgroundColor: '#1E319D',
        paddingVertical: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 12,
    },

    infoButtonText: {
        color: '#E3C7A5',
        fontSize: 15,
        fontWeight: 'bold',
    },

    infoText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },

    billSection: {
        backgroundColor: '#fff',
        marginTop: 16,
        borderRadius: 10,
        padding: 16,
        elevation: 2,
    },

    billHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },

    monthText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#444',
    },

    statusBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FDEDED',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    statusText: {
        marginLeft: 4,
        fontSize: 12,
        color: 'red',
        fontWeight: '600',
    },

    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderTopWidth: 1,
        borderColor: '#ccc',
    },

    tableHeaderCell: {
        flex: 1,
        fontWeight: 'bold',
        fontSize: 13,
        textAlign: 'center',
        color: '#333',
    },

    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },

    tableCell: {
        flex: 1,
        fontSize: 13,
        textAlign: 'center',
        color: '#444',
    },

    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        marginTop: 10,
        borderTopWidth: 1,
        borderColor: '#ccc',
    },

    totalLabel: {
        fontWeight: 'bold',
        fontSize: 14,
        color: 'red',
    },

    totalAmount: {
        fontWeight: 'bold',
        fontSize: 14,
        color: 'red',
    },

    emailSection: {
        marginTop: 20,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        elevation: 2,
        marginBottom: 100,
    },

    emailButton: {
        backgroundColor: '#1E319D',
        paddingVertical: 10,
        borderBottomRightRadius: 20,
        borderBottomLeftRadius: 20,
        alignItems: 'center',
        marginBottom: 12,
    },

    emailLabel: {
        fontSize: 15,
        color: '#E3C7A5',
        marginBottom: 4,
        fontWeight: 'bold'
    },

    emailText: {
        color: '#ABABAB',
        textAlign: 'center',
        fontWeight: 'bold',
    },

    pay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },

    payIcon: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },

    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E319D',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        elevation: 5, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },

    payText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    disabledButton: {
        backgroundColor: '#999999',
    },

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    dialog: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },

    dialogTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },

    dialogContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
    },

    dialogOption: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        height: 80,
    },

    paymentIcon: {
        width: 70,
        height: 70,
        resizeMode: 'contain',
    },

    dialogOptionText: {
        fontSize: 16,
        color: '#333',
        marginTop: 5,
    },

});
