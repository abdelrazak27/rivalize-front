import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { formatTimestamp } from '../utils/date';

const NotificationsButton = ({ userId }) => {
    const [visible, setVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);
    // Booléen pour activer ou désactiver les notifications
    const activateNotification = true;
    const navigation = useNavigation();

    useEffect(() => {
        if (activateNotification && userId) {
            const fetchNotifications = async () => {
                const notificationsRef = collection(db, 'notifications');
                const q = query(notificationsRef, where('userId', '==', userId));
                const querySnapshot = await getDocs(q);
                const loadedNotifications = [];
                querySnapshot.forEach((doc) => {
                    loadedNotifications.push({ ...doc.data(), id: doc.id });
                });

                loadedNotifications.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

                // A (dé)commenter pour cacher/voir les logs des notifications
                // console.log(loadedNotifications);
                setNotifications(loadedNotifications);
            };

            const interval = setInterval(fetchNotifications, 10000);
            fetchNotifications();

            return () => clearInterval(interval);
        }
    }, [userId]);

    const toggleModal = () => {
        setVisible(!visible);
    };

    const handleNotificationClick = async (notificationId, type, relatedId) => {
        markAsRead(notificationId);
        if (type === 'invitation' && relatedId) {
            toggleModal();
            navigation.navigate('InvitationDetailScreen', { invitationId: relatedId });
        } else if (type === 'request_join_club' && relatedId) {
            toggleModal();
            navigation.navigate('RequestJoinTeamDetailScreen', { requestJoinClubId: relatedId });
        }
    };


    const markAsRead = async (notificationId) => {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            hasBeenRead: true
        });
        setNotifications(notifications.map(inv => inv.id === notificationId ? { ...inv, hasBeenRead: true } : inv));
    };

    return (
        <>
            <TouchableOpacity onPress={toggleModal}>
                <Text>
                    Voir les notifications
                    {notifications.filter(inv => !inv.hasBeenRead).length > 0 && ` (${notifications.filter(inv => !inv.hasBeenRead).length})`}
                </Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={visible}
                onRequestClose={toggleModal}
            >
                <View style={styles.modalView}>
                    {notifications.map((notification) => (
                        <TouchableOpacity key={notification.id} onPress={() => handleNotificationClick(notification.id, notification.type, notification.requestJoinClubId || notification.invitationId)}>
                            <Text style={notification.hasBeenRead ? styles.readText : styles.unreadText}>
                                {formatTimestamp(notification.timestamp, { showSecond: false, showYear: false })} - {notification.message}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={toggleModal}>
                        <Text>Fermer</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    unreadText: {
        fontWeight: 'bold'
    },
    readText: {
        fontWeight: 'normal'
    }
});

export default NotificationsButton;
