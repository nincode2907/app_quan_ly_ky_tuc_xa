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
        gap: 5,
        marginBottom: 16,
    },
    chip: {
        backgroundColor: '#E3E3E3',
    },
    list: {
        marginTop: 10,
    },
    roomItem: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#F5F5F5',
        marginBottom: 8,
        borderRadius: 5,
        gap: 10,
        
    },

    roomText: {
        fontSize: 15,
    },

    chip: {
        backgroundColor: '#E3E3E3',
    },

    chipSelected: {
        borderColor: '#1E319D',
        borderWidth: 1,
    },
    subText: {
        color: '#ABABAB'
    }
});
