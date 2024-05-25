import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const getPlayerNameById = async (userId) => {
    try {
        const userRef = doc(db, 'utilisateurs', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.firstname + ' ' + userData.lastname;
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error("Error fetching user name: ", error);
        throw error;
    }
};
