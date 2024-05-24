import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const getTeamName = async (teamId) => {
    try {
        const teamRef = doc(db, 'equipes', teamId);
        const teamDoc = await getDoc(teamRef);
        if (teamDoc.exists()) {
            return teamDoc.data().name;
        } else {
            console.error("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting document:", error);
        return null;
    }
};
