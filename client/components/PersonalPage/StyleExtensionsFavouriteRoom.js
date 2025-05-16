import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    filterText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#1E319D',
    },
    card: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 3,
    },
    roomImage: {
        width: '100%',
        height: 180,
    },
    roomInfo: {
        padding: 12,
    },
    roomName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        color: '#333',
    },
    roomPrice: {
        fontSize: 15,
        color: '#E07A5F',
        marginBottom: 4,
    },
    roomTime: {
        fontSize: 13,
        color: '#888',
        marginBottom: 6,
    },
    roomBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    peopleText: {
        fontSize: 14,
        color: '#555',
    },
    viewMore: {
        fontSize: 14,
        color: '#1E319D',
    },
    roomList: {
        paddingBottom: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 16,
        marginTop: 32,
    },
});

