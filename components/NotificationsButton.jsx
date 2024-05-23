import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { formatTimestamp } from '../utils/date';
import SquareButtonIcon from './SquareButtonIcon';
import Ionicons from 'react-native-vector-icons/Ionicons';

const NotificationsButton = ({ userId }) => {
    const [visible, setVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);
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
                checkForUnreadNotifications(loadedNotifications);
            };

            const interval = setInterval(fetchNotifications, 10000);
            fetchNotifications();

            return () => clearInterval(interval);
        }
    }, [userId]);

    const checkForUnreadNotifications = (notifications) => {
        const hasUnread = notifications.some(notification => !notification.hasBeenRead);
        setHasUnread(hasUnread);
    };

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
        const updatedNotifications = notifications.map(inv => inv.id === notificationId ? { ...inv, hasBeenRead: true } : inv);
        setNotifications(updatedNotifications);
        checkForUnreadNotifications(updatedNotifications);
    };

    return (
        <View style={styles.buttonContainer}>
            <SquareButtonIcon
                onPress={toggleModal}
                IconComponent={Ionicons}
                iconName="notifications"
                iconSize={30}
                isFocused={visible}
            />
            {hasUnread && <View style={styles.notificationBadge} />}

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
        </View>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 13,
        right: 13,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'red',
    },
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