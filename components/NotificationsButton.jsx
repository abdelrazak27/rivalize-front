import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const NotificationsButton = ({ userId }) => {
    const [visible, setVisible] = useState(false);
    const [invitations, setInvitations] = useState([]);
    // Booléen pour activer ou désactiver les notifications
    const activateNotification = false;
    const navigation = useNavigation();

    useEffect(() => {
        if(activateNotification) {
            const fetchInvitations = async () => {
                const invitationsRef = collection(db, 'invitations');
                const q = query(invitationsRef, where('invitedUid', '==', userId));
    
                const querySnapshot = await getDocs(q);
                const loadedInvitations = [];
                querySnapshot.forEach((doc) => {
                    loadedInvitations.push({ ...doc.data(), id: doc.id });
                });
                // A décommenter pour voir les logs d'invitations
                console.log(loadedInvitations);
                setInvitations(loadedInvitations);
            };
    
            const interval = setInterval(fetchInvitations, 10000);
            fetchInvitations();
    
            return () => clearInterval(interval);
        }
    }, [userId]);

    const toggleModal = () => {
        setVisible(!visible);
    };

    const handleInvitationClick = async (invitationId) => {
        markAsRead(invitationId);
        toggleModal();
        navigation.navigate('InvitationDetailScreen', { invitationId: invitationId });
    };

    const markAsRead = async (invitationId) => {
        const invitationRef = doc(db, 'invitations', invitationId);
        await updateDoc(invitationRef, {
            hasBeenRead: true
        });
        setInvitations(invitations.map(inv => inv.id === invitationId ? { ...inv, hasBeenRead: true } : inv));
    };

    return (
        <>
            <TouchableOpacity onPress={toggleModal}>
                <Text>
                    Voir les notifications
                    {invitations.filter(inv => !inv.hasBeenRead).length > 0 && ` (${invitations.filter(inv => !inv.hasBeenRead).length})`}
                </Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={visible}
                onRequestClose={toggleModal}
            >
                <View style={styles.modalView}>
                    {invitations.map((invitation) => (
                        <TouchableOpacity key={invitation.id} onPress={() => handleInvitationClick(invitation.id)}>
                            <Text style={invitation.hasBeenRead ? styles.readText : styles.unreadText}>
                                Invitation de reçu de {invitation.clubId}.
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
