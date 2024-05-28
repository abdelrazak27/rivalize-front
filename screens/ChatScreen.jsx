import React, { useState, useEffect } from 'react';
import { GiftedChat, InputToolbar, Bubble, Send, Composer } from 'react-native-gifted-chat';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../firebaseConfig';
import { View, Text, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { useUser } from '../context/UserContext';
import colors from '../styles/colors';
import { fonts } from '../styles/fonts';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

function ChatScreen({ route }) {
    const { tournamentId } = route.params;
    const [messages, setMessages] = useState([]);
    const { user } = useUser();

    LogBox.ignoreLogs([
        'Avatar: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.'
    ]);

    useEffect(() => {
        if (!user) return;

        const messagesCollection = collection(db, "tournois", tournamentId, "messages");
        const q = query(messagesCollection);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesFirestore = snapshot.docChanges()
                .filter(({ type }) => type === 'added')
                .map(({ doc }) => {
                    const message = doc.data();
                    const createdAt = message.createdAt ? message.createdAt.toDate() : new Date();
                    return { ...message, createdAt };
                })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            appendMessages(messagesFirestore);
        });

        return () => unsubscribe();
    }, [tournamentId, user]);

    const appendMessages = (messages) => {
        setMessages((previousMessages) => GiftedChat.append(previousMessages, messages));
    };

    const onSend = async (messages = []) => {
        if (!user) return;

        const writes = messages.map(m => addDoc(collection(db, "tournois", tournamentId, "messages"), {
            ...m,
            user: {
                _id: user.uid,
                name: `${user.firstname} ${user.lastname}`
            },
            createdAt: serverTimestamp(),
        }));
        await Promise.all(writes);
    };

    const renderInputToolbar = (props) => {
        return (
            <InputToolbar
                {...props}
                primaryStyle={{ alignItems: 'center' }}
            />
        );
    };

    const renderBubble = (props) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    left: {
                        backgroundColor: colors.lightgrey,
                    },
                    right: {
                        backgroundColor: colors.primary,
                    },
                }}
                textStyle={{
                    left: {
                        color: colors.darkgrey,
                        fontFamily: fonts.OutfitRegular,
                        padding: 5,
                    },
                    right: {
                        color: "white",
                        fontFamily: fonts.OutfitRegular,
                        padding: 5,
                    },
                }}
            />
        );
    };

    const renderSend = (props) => {
        return (
            <Send {...props}>
                <View style={styles.sendingContainer}>
                    <FontAwesome name="send" size={24} color={colors.primary} />
                </View>
            </Send>
        );
    };

    const renderComposer = (props) => {
        return (
            <Composer
                {...props}
                textInputStyle={styles.composer}
            />
        );
    };

    if (!user) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Chargement de l'utilisateur...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.chatContainer}>
                <GiftedChat
                    messages={messages}
                    onSend={messages => onSend(messages)}
                    user={{
                        _id: user.uid,
                        name: `${user.firstname} ${user.lastname}`
                    }}
                    renderUsernameOnMessage={true}
                    renderInputToolbar={renderInputToolbar}
                    renderBubble={renderBubble}
                    renderSend={renderSend}
                    renderComposer={renderComposer}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    chatContainer: {
        flex: 1,
        paddingHorizontal: 30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 44,
        width: 44,
    },
});

export default ChatScreen;