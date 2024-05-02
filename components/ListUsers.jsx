import { useState, useEffect } from "react";
import { Text, View, ActivityIndicator, TouchableOpacity, Button, Alert } from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

function ListUsers({ arrayList, navigation, setTeamData }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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
                            const userRef = doc(db, "utilisateurs", userId);
                            await updateDoc(userRef, {
                                team: null
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
            {users.length > 0 ? users.map((user, index) => (
                <View key={index}>
                    <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen', { userId: user.userId })}>
                        <Text>{user.firstname} {user.lastname}</Text>
                    </TouchableOpacity>
                    <Button title="Exclure de l'équipe" onPress={() => excludePlayer(user.userId)} />
                </View>
            )) : (
                <Text>Aucun joueur dans ce club</Text>
            )}
        </View>
    );
}

export default ListUsers;
