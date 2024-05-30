import { useState, useEffect } from "react";
import { View, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { arrayRemove, doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import uuid from 'react-native-uuid';
import { useUser } from "../context/UserContext";
import CustomList from "./CustomList";
import ItemList from "./ItemList";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from "../styles/colors";
import { fonts } from "../styles/fonts";
import { useLoading } from "../context/LoadingContext";

function ListUsers({ arrayList, navigation, setTeamData, teamId }) {
    const [users, setUsers] = useState([]);
    const { user } = useUser();
    const { isLoading, setIsLoading } = useLoading();

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
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
            setIsLoading(false);
        };

        fetchUsers();
    }, [arrayList]);

    const excludePlayer = async (userId) => {
        try {
            Alert.alert(
                "Confirmation",
                "Voulez-vous vraiment exclure ce joueur du club ?",
                [
                    {
                        text: "Annuler",
                        style: "cancel"
                    },
                    {
                        text: "Exclure",
                        style: "destructive",
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

    if (isLoading) {
        return <ActivityIndicator size="large" />;
    }

    return (
        <View>
            <CustomList>
                {users.length > 0 && users.map((userOfList, index) => (
                    <View key={index}>
                        {user.accountType === "coach" && user.teams.includes(teamId) ? (
                            <ItemList
                                text={`${userOfList.firstname} ${userOfList.lastname}`}
                                onPress={() => navigation.navigate('ProfileScreen', { userId: userOfList.userId })}
                                RightButtonIconComponent={(user.accountType === "coach" && user.teams.includes(teamId)) && MaterialCommunityIcons}
                                rightButtonIconName={(user.accountType === "coach" && user.teams.includes(teamId)) && "close-box-outline"}
                                rightButtonOnPress={(user.accountType === "coach" && user.teams.includes(teamId)) && (() => excludePlayer(userOfList.userId))}
                            />
                        ) : (
                            <ItemList
                                text={`${userOfList.firstname} ${userOfList.lastname}`}
                                onPress={() => navigation.navigate('ProfileScreen', { userId: userOfList.userId })}
                            />
                        )}
                    </View>
                ))}
            </CustomList>
        </View>
    );
}

export default ListUsers;

const styles = StyleSheet.create({
    textInfos: {
        fontSize: 14,
        color: colors.secondary,
        fontFamily: fonts.OutfitSemiBold,
        textAlign: 'center'
    }
});