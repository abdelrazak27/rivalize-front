import { useState, useEffect } from "react";
import { Text, View, ActivityIndicator, TouchableOpacity, Button, Alert } from "react-native";
import { arrayRemove, doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import uuid from 'react-native-uuid';
import { useUser } from "../context/UserContext";

function ListUsers({ arrayList, navigation, setTeamData, teamId }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();

    useEffect(() => {
        const fetchUsers = async () => {
            const usersData = [];
            for (const userId of arrayList) {
                const userRef = doc(db, "utilisateurs", userId);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    userData.userId = userId;
                    usersData.push(userData);
                }
            }
            setUsers(usersData);
            setLoading(false);
        };

        fetchUsers();
    }, [arrayList]);

    const excludePlayer = async (userId) => {
        try {
            Alert.alert(
                "Confirmation",
                "Voulez-vous vraiment exclure ce joueur de l'équipe ?",
                [
                    {
                        text: "Annuler",
                        style: "cancel"
                    },
                    {
                        text: "Exclure",
                        onPress: async () => {
                            const notificationId = uuid.v4();
                            const userRef = doc(db, "utilisateurs", userId);
                            const teamRef = doc(db, "equipes", teamId);
                            const notificationRef = doc(db, 'notifications', notificationId);

                            const notificationDetails = {
                                userId: userId,
                                message: "Vous avez été exclu de votre club",
                                hasBeenRead: false,
                                timestamp: Timestamp.now(),
                                type: "info",
                            };

                            await setDoc(notificationRef, notificationDetails);

                            await updateDoc(userRef, {
                                team: null
                            });

                            await updateDoc(teamRef, {
                                players: arrayRemove(userId)
                            });

                            setUsers(users.filter(user => user.userId !== userId));

                            setTeamData(prevData => ({
                                ...prevData,
                                players: prevData.players.filter(playerId => playerId !== userId)
                            }));
                        }
                    }
                ]
            );

        } catch (error) {
            console.error("Erreur lors de l'exclusion du joueur :", error);
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" />;
    }

    return (
        <View>
            {users.length > 0 ? users.map((userOfList, index) => (
                <View key={index}>
                    <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen', { userId: userOfList.userId })}>
                        <Text>{userOfList.firstname} {userOfList.lastname}</Text>
                    </TouchableOpacity>
                    {user.accountType === "coach" && user.teams.includes(teamId) && (
                        <Button title="Exclure de l'équipe" onPress={() => excludePlayer(userOfList.userId)} />
                    )}
                </View>
            )) : (
                <Text>Aucun joueur dans ce club</Text>
            )}
        </View>
    );
}

export default ListUsers;
