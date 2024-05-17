import React, { useState, useEffect } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { useUser } from '../context/UserContext';
import { db } from '../firebaseConfig';

function ChatScreen() {
    const [messages, setMessages] = useState([]);
    const { user } = useUser();

    useEffect(() => {
        const messagesCollection = collection(db, "messages");
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
    }, []);

    const appendMessages = (messages) => {
        setMessages((previousMessages) => GiftedChat.append(previousMessages, messages));
    };

    const onSend = async (messages = []) => {
        const writes = messages.map(m => addDoc(collection(db, "messages"), {
            ...m,
            user,
            createdAt: serverTimestamp(),
        }));
        await Promise.all(writes);
    };

    return (
        <GiftedChat
            messages={messages}
            onSend={messages => onSend(messages)}
            user={user}
        />
    );
}

export default ChatScreen;
