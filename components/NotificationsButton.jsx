import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { formatTimestamp } from '../utils/date';
import SquareButtonIcon from './SquareButtonIcon';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../styles/colors';
import { PrimaryColorText, Subtitle, Title } from './TextComponents';
import Spacer from './Spacer';
import { fonts } from '../styles/fonts';
import FunctionButton from './FunctionButton';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NotificationsButton = ({ userId }) => {
    const [visible, setVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const intervalRef = useRef(null);

    // Booléen pour activer ou désactiver les notifications
    const activateNotification = false;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && activateNotification && userId) {
                const fetchNotifications = async () => {
                    try {
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
                    } catch (error) {
                        console.error("Error fetching notifications:", error);
                    }
                };

                intervalRef.current = setInterval(fetchNotifications, 10000);
                fetchNotifications();
            } else {
                clearInterval(intervalRef.current);
            }
        });

        return () => {
            clearInterval(intervalRef.current);
            unsubscribe();
        };
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
                <BlurView intensity={6} style={[styles.absolute, { top: insets.top + 110 }]}>
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <Title>Vos <PrimaryColorText>notifications</PrimaryColorText></Title>
                            {notifications.filter(inv => !inv.hasBeenRead).length > 0 ? <Subtitle>Vous avez {notifications.filter(inv => !inv.hasBeenRead).length} notification(s) non lue(s)</Subtitle> : <Subtitle>Vous avez aucune notification</Subtitle>}
                        </View>
                        <ScrollView style={styles.notificationList}>
                            {notifications.length > 0 && (
                                notifications.map((notification) => (
                                    <View key={notification.id}>
                                        <Spacer top={10} bottom={10} />
                                        <TouchableOpacity onPress={() => handleNotificationClick(notification.id, notification.type, notification.requestJoinClubId || notification.invitationId)}>
                                            <Text style={styles.notificationDate}>
                                                {formatTimestamp(notification.timestamp, { showSecond: false, showYear: false })}
                                            </Text>
                                            <Text style={[styles.notificationText, notification.hasBeenRead ? styles.readText : styles.unreadText]}>
                                                {notification.message}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <FunctionButton 
                                title='Fermer'
                                onPress={toggleModal}
                            />
                        </View>
                    </View>
                </BlurView>
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
    notificationDate: {
        fontSize: 12,
        fontFamily: fonts.OutfitSemiBold,
        color: colors.secondary
    },
    notificationText: {
        fontSize: 14,
    },
    textInfos: {
        textAlign: 'center',
        fontSize: 14,
        fontFamily: fonts.OutfitSemiBold,
    },
    modalView: {
        marginHorizontal: 30,
        backgroundColor: "white",
        padding: 25,
        borderRadius: 8,
        borderColor: colors.darkgrey,
        borderWidth: 2,
        elevation: 5,
        height: '95%',
    },
    absolute: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 15,
    },
    modalFooter: {
        paddingTop: 20,
        borderTopWidth: 1,
        borderColor: colors.lightgrey,
        alignItems: 'center',
    },
    notificationList: {
        flex: 1,
        marginBottom: 15,
    },
    unreadText: {
        fontFamily: fonts.OutfitBold,
    },
    readText: {
        fontFamily: fonts.OutfitRegular,
    },
});

export default NotificationsButton;
