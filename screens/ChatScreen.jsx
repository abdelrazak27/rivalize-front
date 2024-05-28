import React, { useState, useEffect } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../firebaseConfig';
import { View, Text, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { useUser } from '../context/UserContext';

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
            <GiftedChat
                messages={messages}
                onSend={messages => onSend(messages)}
                user={{
                    _id: user.uid,
                    name: `${user.firstname} ${user.lastname}`
                }}
                renderUsernameOnMessage={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChatScreen;
