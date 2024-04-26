import { useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const fetchInvitations = async (userId) => {
    const invitationsRef = collection(db, 'invitations');
    const q = query(invitationsRef, where('invitedUid', '==', userId), where('hasBeenRead', '==', false));

    try {
        const querySnapshot = await getDocs(q);
        const invitations = [];
        querySnapshot.forEach((doc) => {
            invitations.push(doc.data());
        });
        console.log('Invitations:', invitations);
    } catch (error) {
        console.error('Error fetching invitations:', error);
    }
};

export const usePolling = (userId) => {
    useEffect(() => {
        const interval = setInterval(() => {
            fetchInvitations(userId);
        }, 10000); // Polling toutes les 10 secondes

        return () => clearInterval(interval);
    }, [userId]);
};
