import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E319D',
        paddingHorizontal: 10,
        paddingVertical: 10,

    },
    searchInput: {
        marginTop: 10,
        marginBottom: 10,
        flex: 1,
        marginHorizontal: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
        color: 'black',
        paddingHorizontal: 12,
        paddingVertical: 5,
        fontSize: 15,
    },
    search: {
        fontSize: 25,
        color: '#E3C7A5',
    },
    filterBar: {
        marginTop: 1,
        backgroundColor: '#1E319D',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    filterText: {
        color: '#E3C7A5',
        fontWeight: 'bold',
        fontSize: 16,
    },
    iconBar: {
        flexDirection: 'row',
        gap: 20
    },
    roomList: {
        padding: 10,
    },
    card: {
        backgroundColor: '#F1F1F1',
        borderRadius: 10,
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
});
