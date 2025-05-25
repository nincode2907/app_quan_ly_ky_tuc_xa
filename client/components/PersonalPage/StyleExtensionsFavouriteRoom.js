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
        backgroundColor: '#F1F1F1',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 15,
    },
    roomImage: {
        width: '100%',
        height: 130,
    },
    roomInfo: {
        padding: 10,
    },
    roomName: {
        fontWeight: '600',
        fontSize: 15,
        marginBottom: 4,
    },
    roomPrice: {
        color: 'red',
        fontWeight: '500',
        marginBottom: 2,
    },
    roomTime: {
        fontSize: 12,
        color: 'gray',
    },
    roomBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
        alignItems: 'center',
    },
    roomPeople: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    peopleText: {
        marginLeft: 6,
        fontSize: 13,
        color: '#444',
    },
    viewMore: {
        fontSize: 13,
        color: '#1E319D',
        fontWeight: '500',
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

