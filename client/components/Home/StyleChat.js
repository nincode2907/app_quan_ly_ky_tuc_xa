import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#DEDEDE',
    },
    chatContainer: {
        padding: 16,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        maxWidth: '80%',
    },
    botMessage: {
        backgroundColor: 'white',
        alignSelf: 'flex-start',
    },
    userMessage: {
        backgroundColor: '#DCF8C6',
        alignSelf: 'flex-end',
    },
    messageText: {
        fontSize: 14,
    },
    timestamp: {
        fontSize: 10,
        color: '#888',
        marginTop: 4,
        textAlign: 'right',
    },
    suggestionBox: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        fontSize: 14,
    },
    suggestionTitle: {
        fontWeight: '500',
        marginBottom: 8,
    },
    suggestionItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    suggestionText: {
        color: '#333',
        flex: 1,
        paddingRight: 8,
    },
    manualInputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        alignContent:'center',
        justifyContent:'center'
    },
    manualInputText: {
        marginLeft: 6,
        color: '#555',
        fontSize: 14,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderColor: '#ddd',
        backgroundColor: 'white',
    },
    input: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        marginRight: 8,
        fontSize: 14,
    },
});
