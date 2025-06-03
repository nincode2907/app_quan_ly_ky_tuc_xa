import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#DEDEDE",
    },
    header: {
        backgroundColor: "#1E319D",
        alignItems: "center",
        paddingVertical: 50,
        paddingTop: 30,
    },
    logo: {
        width: 170,
        height: 80,
        resizeMode: "contain",
    },
    slogan: {
        color: "#E3C7A5",
        fontSize: 13,
    },
    searchBar: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginTop: -25,
        padding: 12,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    avatar: {
        width: 35,
        height: 35,
        borderRadius: 50,
    },
    rightIcons: {
        flexDirection: "row",
        gap: 5,
        marginRight: 5,
    },
    imgIcon: {
        width: 25,
        height: 25,
        marginLeft: 10,
    },


    section: {
        marginTop: 15,
        backgroundColor: '#fff',

    },
    sectionHeader: {
        backgroundColor: '#1E319D',
        padding: 10,
    },
    sectionTitle: {
        color: '#E3C7A5',
        fontSize: 15,
        fontWeight: 'bold',
    },


    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        gap: 12,
        margin: 15
    },

    gridItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 8,
    },

    buy: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        paddingVertical: 15,
    },

    itemBuy: {
        alignItems: 'center',
        marginBottom: 20,
    },

    sectionContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        paddingVertical: 15,
        margin: 15
    },

    imgIcon: {
        width: 24,
        height: 24,
        marginRight: 8,
        resizeMode: 'contain',
    },
    item: {
        alignItems: 'center',
        width: '40%',
    },
    itemText: {
        fontSize: 15,

    },
});
