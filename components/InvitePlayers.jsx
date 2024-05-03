import { Text, View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, Timestamp, setDoc, doc, getDocs } from "firebase/firestore";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import { db } from "../firebaseConfig";
import SelectedPlayersList from "../screens/CreateTeamScreen/SelectedPlayersList";
import uuid from 'react-native-uuid';

function InvitePlayers({ arrayList }) {
    const [players, setPlayers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPlayers, setFilteredPlayers] = useState([]);
    const [selectedPlayerUids, setSelectedPlayerUids] = useState([]);
    const [invitedPlayerUids, setInvitedPlayerUids] = useState([]);
    const navigation = useNavigation();
    const route = useRoute();
    const { teamId } = route.params;

    useEffect(() => {
        const fetchInvitations = async () => {
            const invitationsQuery = query(collection(db, "invitations"), where("clubId", "==", teamId), where("state", "==", "pending"));
            const querySnapshot = await getDocs(invitationsQuery);
            const invitedUids = [];
            querySnapshot.forEach((doc) => {
                invitedUids.push(doc.data().invitedUid);
            });
            setInvitedPlayerUids(invitedUids);
        };

        fetchInvitations();
    }, [teamId]);

    useEffect(() => {
        const q = query(collection(db, "utilisateurs"), where("accountType", "==", "player"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const playersArray = [];
            querySnapshot.forEach((doc) => {
                playersArray.push({ uid: doc.id, ...doc.data() });
            });
            setPlayers(playersArray);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (searchQuery.length >= 2) {
            const filtered = players.filter(player =>
                (`${player.firstname} ${player.lastname}`).toLowerCase().includes(searchQuery.toLowerCase()) &&
                !selectedPlayerUids.includes(player.uid) &&
                !invitedPlayerUids.includes(player.uid) &&
                !arrayList.includes(player.uid)
            );
            setFilteredPlayers(filtered.slice(0, 20));
        } else {
            setFilteredPlayers([]);
        }
    }, [searchQuery, players, selectedPlayerUids, invitedPlayerUids]);

    const selectPlayer = (uid) => {
        if (!selectedPlayerUids.includes(uid)) {
            setSelectedPlayerUids([...selectedPlayerUids, uid]);
        }
    };

    const removePlayer = (uid) => {
        setSelectedPlayerUids(selectedPlayerUids.filter(id => id !== uid));
    };

    const finishSelection = async () => {
        console.log('Selected Player UIDs:', selectedPlayerUids);
    
        if (selectedPlayerUids.length > 0) {
            const operationsPromises = selectedPlayerUids.flatMap(uid => {
                const invitationId = uuid.v4();
                const notificationId = uuid.v4();
                const invitationRef = doc(db, 'invitations', invitationId);
                const notificationRef = doc(db, 'notifications', notificationId);
    
                const invitationDetails = {
                    invitedUid: uid,
                    timestamp: Timestamp.now(),
                    clubId: teamId,
                    state: 'pending',
                };
    
                const notificationDetails = {
                    userId: uid,
                    message: "Vous êtes invité à rejoindre un club",
                    hasBeenRead: false,
                    timestamp: Timestamp.now(),
                    type: "invitation",
                    invitationId: invitationId,
                };
    
                const setInvitationPromise = setDoc(invitationRef, invitationDetails);
                const setNotificationPromise = setDoc(notificationRef, notificationDetails);
    
                return [setInvitationPromise, setNotificationPromise];
            });
    
            try {
                await Promise.all(operationsPromises.flat());
                console.log("Toutes les invitations et notifications ont été créées.");
            } catch (error) {
                console.error("Erreur lors de la création des invitations et notifications : ", error);
                return;
            }
        } else {
            console.log("Aucun joueur sélectionné pour envoyer une invitation.");
        }
    };
    
    const navigateHome = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ 
                    name: 'HomeScreen'
                }],
            })
        );
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Rechercher un joueur"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {filteredPlayers.length > 0 && filteredPlayers.map((player) => (
                <TouchableOpacity key={player.uid} onPress={() => selectPlayer(player.uid)}>
                    <Text style={styles.playerItem}>
                        {player.firstname} {player.lastname}
                    </Text>
                </TouchableOpacity>
            ))}
            <SelectedPlayersList selectedPlayers={players.filter(player => selectedPlayerUids.includes(player.uid))} onRemovePlayer={removePlayer} />
            <TouchableOpacity onPress={() => {
                finishSelection();
                navigateHome();
            }}>
                <Text>Inviter la sélection</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 50
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
    },
    playerItem: {
        padding: 10,
        fontSize: 18
    }
});

export default InvitePlayers;
