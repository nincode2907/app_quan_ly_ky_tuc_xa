import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StyleChat from './StyleChat';

const HomeChat = () => {
    const [messages, setMessages] = useState([
        {
            id: 'bot1',
            type: 'bot',
            content: 'Chào bạn thân yêu của Cú Mèo, hôm nay Cú Mèo có thể giúp gì cho bạn nè!!!',
            time: new Date(),
        },
    ]);

    const suggestions = [
        'Giờ ra vào của ký túc xá như thế nào?',
        'Tôi muốn hỗ trợ hướng dẫn đóng tiền điện?',
        'Vì sao tôi không thể thanh toán tiền điện bằng Ví Momo?',
    ];

    const [showSuggestions, setShowSuggestions] = useState(true);
    const [inputText, setInputText] = useState('');

    const handleSend = (text) => {
        if (!text.trim()) return;

        const newMessage = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: text,
            time: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputText('');
    };

    const handleSuggestionPress = (text) => {
        setShowSuggestions(false);
        handleSend(text);
    };

    const renderMessage = ({ item }) => (
        <View
            style={[
                StyleChat.messageBubble,
                item.type === 'bot' ? StyleChat.botMessage : StyleChat.userMessage,
            ]}
        >
            <Text style={StyleChat.messageText}>{item.content}</Text>
            <Text style={StyleChat.timestamp}>
                {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={StyleChat.container}>
                    <FlatList
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessage}
                        contentContainerStyle={StyleChat.chatContainer}
                        ListFooterComponent={
                            showSuggestions ? (
                                <View style={StyleChat.suggestionBox}>
                                    <Text style={StyleChat.suggestionTitle}>🤖 Bạn muốn hỏi về:</Text>
                                    {suggestions.map((s, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={StyleChat.suggestionItem}
                                            onPress={() => handleSuggestionPress(s)}
                                        >
                                            <Text style={StyleChat.suggestionText}>{s}</Text>
                                            <Ionicons name="chevron-forward" size={18} color="#666" />
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity style={StyleChat.manualInputBox}>
                                        <Ionicons name="chatbubbles-outline" size={16} color="#666" />
                                        <Text style={StyleChat.manualInputText}>Hãy hỏi gì bạn muốn</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null
                        }
                        keyboardShouldPersistTaps="handled"
                    />

                    <View style={StyleChat.inputBox}>
                        <TextInput
                            style={StyleChat.input}
                            placeholder="Xin chào, Cú Mèo có thể giúp gì được cho bạn..."
                            placeholderTextColor="#B0B0B0"
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={() => handleSend(inputText)}
                        />
                        <TouchableOpacity onPress={() => handleSend(inputText)}>
                            <Ionicons name="send" size={22} color="#1E319D" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default HomeChat;
