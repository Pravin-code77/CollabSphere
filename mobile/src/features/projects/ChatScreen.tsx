import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Image
} from 'react-native';
import io from 'socket.io-client';
import { useAuth } from '../../providers/AuthProvider';
import client from '../../api/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// Derive socket URL from the same base as the API client (strip '/api')
const SOCKET_URL = (client.defaults.baseURL || '').replace('/api', '');

const ChatScreen = ({ route }: any) => {
    const { project } = route.params;
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const socket = useRef<any>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchMessages();

        // Initialize socket
        socket.current = io(SOCKET_URL);

        socket.current.on('connect', () => {
            console.log('Connected to chat server');
            socket.current.emit('join_project', {
                projectId: project._id,
                userId: user._id || user.id
            });
        });

        socket.current.on('new_message', (message: any) => {
            setMessages(prev => [...prev, message]);
        });

        return () => {
            if (socket.current) socket.current.disconnect();
        };
    }, [project._id]);

    const fetchMessages = async () => {
        try {
            const response = await client.get(`/projects/${project._id}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const sendMessage = () => {
        if (!inputText.trim()) return;

        const messageData = {
            projectId: project._id,
            senderId: user._id || user.id,
            senderName: user.username,
            text: inputText.trim()
        };

        socket.current.emit('send_message', messageData);
        setInputText('');
    };

    const renderMessage = ({ item }: any) => {
        const isMe = item.senderId === (user._id || user.id);
        const time = dayjs(item.createdAt).format('h:mm A');

        return (
            <View style={[
                styles.messageRow,
                isMe ? styles.myMessageRow : styles.otherMessageRow
            ]}>
                {!isMe && (
                    <Image
                        source={{ uri: `https://ui-avatars.com/api/?name=${item.senderName}&background=f1f5f9&color=64748b` }}
                        style={styles.messageAvatar}
                    />
                )}
                <View style={[styles.bubbleWrapper, isMe && styles.myBubbleWrapper]}>
                    <View style={[
                        styles.messageBubble,
                        isMe ? styles.myBubble : styles.otherBubble
                    ]}>
                        {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
                        <Text style={[styles.messageText, isMe && styles.myMessageText]}>
                            {item.text}
                        </Text>
                    </View>
                    <Text style={[styles.timeText, isMe && styles.myTimeText]}>{time}</Text>

                    {/* Visual Heart Reaction shown in image */}
                    {item.text.includes('❤️') && (
                        <View style={[styles.reactionBubble, isMe ? styles.myReaction : styles.otherReaction]}>
                            <Text style={styles.reactionEmoji}>❤️</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{project.title}</Text>
                <Text style={styles.headerSubtitle}>Team Collaboration</Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(_, index) => index.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}
            >
                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                        <View style={styles.sendIcon} />
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    header: {
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    messageList: {
        padding: 20,
    },
    messageRow: {
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    otherMessageRow: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 20, // Align with bubble top rather than time
    },
    bubbleWrapper: {
        maxWidth: '75%',
    },
    myBubbleWrapper: {
        alignItems: 'flex-end',
    },
    messageBubble: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 24,
    },
    myBubble: {
        backgroundColor: '#5d5cf6', // Indigo blue from image
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: '#f1f5f9', // Light gray from image
        borderBottomLeftRadius: 4,
    },
    senderName: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 16,
        color: '#1e293b',
        lineHeight: 22,
    },
    myMessageText: {
        color: 'white',
    },
    timeText: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 4,
        fontWeight: '500',
    },
    myTimeText: {
        textAlign: 'right',
    },
    reactionBubble: {
        position: 'absolute',
        bottom: -15,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 2,
        paddingHorizontal: 6,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    otherReaction: {
        left: 10,
    },
    myReaction: {
        right: 10,
    },
    reactionEmoji: {
        fontSize: 12,
    },
    inputArea: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginRight: 12,
        fontSize: 15,
        color: '#1e293b',
        maxHeight: 120,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sendButton: {
        width: 44,
        height: 44,
        backgroundColor: '#5d5cf6',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 12,
    },
    sendIcon: {
        // Placeholder
    }
});

export default ChatScreen;
