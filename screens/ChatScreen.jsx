import React, { useState, useEffect } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { useUser } from '../context/UserContext';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

function ChatScreen({ route }) {
    const { tournamentId } = route.params;
    const [messages, setMessages] = useState([]);
    const { user } = useUser();
    const navigation = useNavigation();

    useEffect(() => {
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
    }, [tournamentId]);

    const appendMessages = (messages) => {
        setMessages((previousMessages) => GiftedChat.append(previousMessages, messages));
    };

    const onSend = async (messages = []) => {
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

    const handleAvatarPress = (user) => {
        navigation.navigate('ProfileScreen', { userId: user._id });
    };

    return (
        <GiftedChat
            messages={messages}
            onSend={messages => onSend(messages)}
            user={{
                _id: user.uid,
                name: `${user.firstname} ${user.lastname}`
            }}
            onPressAvatar={user => handleAvatarPress(user)}
            renderUsernameOnMessage={true}
        />
    );
}

export default ChatScreen;
