import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '../../configs/AxiosInterceptor';
import StyleChat from './StyleChat';
import { useWebSocket } from '../../contexts/WebSocketContext';

const HomeChat = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [conversationStateId, setConversationStateId] = useState(null);
    const [lastMessageId, setLastMessageId] = useState(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isWaitingForAI, setIsWaitingForAI] = useState(false);
    const [isAdminHandling, setIsAdminHandling] = useState(false);

    const flatListRef = useRef(null);
    const messageIds = useRef(new Set()).current;
    const lastProcessedTime = useRef(0);
    const messagesRef = useRef(messages); 
    const { wsRef } = useWebSocket(); 

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const loadInitialData = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/conversations/');
            const conversations = response.data.results || [];
            if (conversations.length > 0) {
                setConversationStateId(conversations[0].id);
                setIsAdminHandling(conversations[0].is_admin_handling || false);
                await loadMessages(conversations[0].id);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMessages = async (conversationId) => {
        try {
            setIsLoading(true);
            setConversationStateId(conversationId);
            messageIds.clear();

            const response = await axiosInstance.get(`/api/messages/?conversation_state=${conversationId}`);
            const messagesData = response.data.results || response.data;

            if (Array.isArray(messagesData)) {
                const formattedMessages = messagesData.map(msg => {
                    const id = String(msg.id);
                    if (!messageIds.has(id)) {
                        messageIds.add(id);
                        return {
                            id,
                            type: msg.is_from_ai ? 'bot' : (msg.sender?.is_admin ? 'admin' : 'user'),
                            content: msg.content,
                            time: new Date(msg.created_at),
                        };
                    }
                    return null;
                }).filter(msg => msg !== null);

                setMessages(formattedMessages.sort((a, b) => a.time - b.time));
                if (messagesData.length > 0) {
                    setLastMessageId(messagesData[messagesData.length - 1].id);
                    setHasMoreMessages(true);
                }
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMoreMessages = async () => {
        if (!conversationStateId || !lastMessageId || isLoadingMore || !hasMoreMessages) {
            return;
        }

        setIsLoadingMore(true);
        try {
            const response = await axiosInstance.get(
                `/api/messages/load-more/?conversation_state=${conversationStateId}&last_message_id=${lastMessageId}`
            );
            const messagesData = response.data.messages || [];

            if (messagesData.length > 0) {
                const formattedMessages = messagesData.map(msg => {
                    const id = String(msg.id);
                    if (!messageIds.has(id)) {
                        messageIds.add(id);
                        return {
                            id,
                            type: msg.is_from_ai ? 'bot' : (msg.sender?.is_admin ? 'admin' : 'user'),
                            content: msg.content,
                            time: new Date(msg.created_at),
                        };
                    }
                    return null;
                }).filter(msg => msg !== null);

                setMessages(prev => [...formattedMessages, ...prev].sort((a, b) => a.time - b.time));
                setLastMessageId(messagesData[messagesData.length - 1].id);
            } else {
                setHasMoreMessages(false);
            }
        } catch (error) {
            console.error('Error loading more messages:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleSend = useCallback(async () => {
        if (isSending || (!isAdminHandling && isWaitingForAI) || !inputText.trim() || !wsRef.current || !conversationStateId) {
            return;
        }

        setIsSending(true);
        if (!isAdminHandling) {
            setIsWaitingForAI(true);
        }

        try {
            setInputText('');

            if (wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    conversation_state_id: conversationStateId,
                    content: inputText.trim(),
                }));
            } else {
                console.warn('WebSocket not connected');
                if (!isAdminHandling) setIsWaitingForAI(false);
            }
        } catch (error) {
            console.error('Error in handleSend:', error);
            if (!isAdminHandling) setIsWaitingForAI(false);
        } finally {
            setIsSending(false);
        }
    }, [inputText, conversationStateId, isSending, isWaitingForAI, isAdminHandling]);

    const handleScroll = ({ nativeEvent }) => {
        if (nativeEvent.contentOffset.y < 50 && !isLoadingMore && hasMoreMessages) {
            loadMoreMessages();
        }
    };

    const handleWebSocketMessage = useCallback((e) => {
        try {
            const currentTime = Date.now();
            if (currentTime - lastProcessedTime.current < 100) {
                return;
            }
            lastProcessedTime.current = currentTime;

            const data = JSON.parse(e.data);

            if (data.message) {
                const messageId = String(data.message.id);

                if (messageIds.has(messageId)) {
                    return;
                }

                const isDuplicate = messagesRef.current.some(msg => 
                    msg.content === data.message.content && 
                    Math.abs(new Date(msg.time).getTime() - new Date(data.message.created_at).getTime()) < 1000
                );

                if (!isDuplicate) {
                    messageIds.add(messageId);
                    const newMessage = {
                        id: messageId,
                        type: data.message.is_from_ai ? 'bot' : (data.message.sender?.is_admin ? 'admin' : 'user'),
                        content: data.message.content,
                        time: new Date(data.message.created_at),
                    };
                    setMessages(prev => [...prev, newMessage].sort((a, b) => a.time - b.time));
                    setConversationStateId(data.message.conversation_state);

                    if (data.message.is_admin_handling !== undefined) {
                        setIsAdminHandling(data.message.is_admin_handling);
                    }

                    if (data.message.is_from_ai && !isAdminHandling) {
                        setIsWaitingForAI(false);
                    }
                } else {
                    messageIds.add(messageId);
                }

                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
            if (!isAdminHandling) setIsWaitingForAI(false);
        }
    }, [isAdminHandling]);

    const MessageBubble = React.memo(({ item }) => (
        <View
            style={[
                StyleChat.messageBubble,
                item.type === 'bot' || item.type === 'admin' ? StyleChat.botMessage : StyleChat.userMessage,
            ]}
        >
            <Text style={StyleChat.messageText}>{item.content}</Text>
            <Text style={StyleChat.timestamp}>
                {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    ));

    useEffect(() => {
        loadInitialData();

        if (wsRef.current) {
            wsRef.current.onmessage = handleWebSocketMessage;
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.onmessage = null;
            }
        };
    }, [handleWebSocketMessage]); 

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={StyleChat.container}>
                    {isLoading && !messages.length ? (
                        <View style={StyleChat.loadingContainer}>
                            <ActivityIndicator size="large" color="#1E90FF" />
                        </View>
                    ) : (
                        <>
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => <MessageBubble item={item} />}
                                contentContainerStyle={StyleChat.chatContainer}
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                                keyboardShouldPersistTaps="handled"
                                inverted={false}
                                ListFooterComponent={
                                    isLoadingMore ? (
                                        <View style={StyleChat.loadingMoreContainer}>
                                            <ActivityIndicator size="small" color="#1E90FF" />
                                        </View>
                                    ) : null
                                }
                            />
                            <View style={StyleChat.inputBox}>
                                <TextInput
                                    style={StyleChat.input}
                                    placeholder={isAdminHandling ? "Nhập tin nhắn..." : (isWaitingForAI ? "Đang chờ AI trả lời..." : "Nhập tin nhắn...")}
                                    placeholderTextColor="#B0BEC5"
                                    value={inputText}
                                    onChangeText={setInputText}
                                    onSubmitEditing={handleSend}
                                    returnKeyType="send"
                                    enablesReturnKeyAutomatically={true}
                                    editable={isAdminHandling ? true : !isWaitingForAI}
                                />
                                <TouchableOpacity
                                    onPress={handleSend}
                                    disabled={isAdminHandling ? !inputText.trim() || isSending : !inputText.trim() || isSending || isWaitingForAI}
                                >
                                    <Ionicons
                                        name="send"
                                        size={22}
                                        color={isAdminHandling ? (inputText.trim() && !isSending ? "#1E90FF" : "#B0BEC5") : (inputText.trim() && !isSending && !isWaitingForAI ? "#1E90FF" : "#B0BEC5")}
                                    />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default HomeChat;