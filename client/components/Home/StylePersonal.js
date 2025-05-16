import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#DEDEDE',
        marginTop: 50,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // 👈 Giúp đẩy 2 icon ra sát 2 bên
        backgroundColor: '#1E319D',
        paddingHorizontal: 15,
        height: 60,
    },
    headerLeft: {
        flexDirection: 'row',
        gap: 15,
    },

    headerText: {
        color: '#E3C7A5',
        fontSize: 20,
        fontWeight: 'bold',
    },

    headerIconLeft: {
        color: '#E3C7A5',
        fontSize: 30,
    },

    headerRight: {
        color: '#E3C7A5',
        fontSize: 25,
    },

    scroll: {
        padding: 16,
        paddingBottom: 32,
    },
    avatarContainer: {
        alignItems: 'center',
        backgroundColor: '#1E319D',
        paddingVertical: 24,
        borderRadius: 12,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FFF',
    },
    name: {
        color: '#E3C7A5',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 12,
    },
    divider: {
        width: '50%',
        height: 1,
        backgroundColor: '#E3C7A5',
        marginTop: 12,
    },
    infoBox: {
        backgroundColor: '#FFF',
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    infoRow: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#D5D5D5',
    },
    label: {
        color: '#666',
        fontSize: 13,
    },
    value: {
        fontSize: 15,
        marginTop: 4,
    },

    updateButton: {
        flexDirection: 'row',
        alignSelf: 'center',
        marginTop: 180,
        backgroundColor: '#FFF',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DDD',
        alignItems: 'center',
        gap: 8,
    },
    updateText: {
        fontSize: 15,
        fontWeight: '500',
    },



    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    dialog: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    dialogText: {
        fontSize: 18,
        paddingVertical: 10,
        textAlign: 'center',
    },

    dialogLogout: {
        fontSize: 18,
        paddingVertical: 10,
        textAlign: 'center',
        color: 'red'
    },

    separator: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 5,
    },

});
