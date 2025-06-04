import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#DEDEDE',
        height: 1000,
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
    billItem: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#F5F5F5',
        marginBottom: 8,
        borderRadius: 5,
        gap: 10,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        
    },

    billText: {
        fontSize: 15,
    },

    chip: {
        backgroundColor: '#E3E3E3',
    },

    chipSelected: {
        borderColor: '#1E319D',
        borderWidth: 1,
    },

});
