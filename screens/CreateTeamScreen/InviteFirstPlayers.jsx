import { BackHandler, Text, View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, Timestamp, setDoc, doc } from "firebase/firestore";
import SelectedPlayersList from "./SelectedPlayersList";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import { useUser } from "../../context/UserContext";

function InviteFirstPlayers() {
    const [players, setPlayers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPlayers, setFilteredPlayers] = useState([]);
    const [selectedPlayerUids, setSelectedPlayerUids] = useState([]);
    const navigation = useNavigation();
    const route = useRoute();
    const { teamId } = route.params;
    const { setUser } = useUser();



    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => true
        );

        return () => backHandler.remove();
    }, []);

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
                !selectedPlayerUids.includes(player.uid)
            );
            setFilteredPlayers(filtered.slice(0, 20));
        } else {
            setFilteredPlayers([]);
        }
    }, [searchQuery, players, selectedPlayerUids]);

    const selectPlayer = (uid) => {
        if (!selectedPlayerUids.includes(uid)) {
            setSelectedPlayerUids([...selectedPlayerUids, uid]);
        }
    };

    const removePlayer = (uid) => {
        setSelectedPlayerUids(selectedPlayerUids.filter(id => id !== uid));
    };

    const addTeamToCoach = (newTeam) => {
        setUser(prevUser => ({
            ...prevUser,
            teams: [...(prevUser.teams || []), newTeam]
        }));
    };

    const finishSelection = async () => {
        console.log('Selected Player UIDs:', selectedPlayerUids);
        addTeamToCoach(teamId);
    
        if (selectedPlayerUids.length > 0) {
            const invitationsPromises = selectedPlayerUids.map(uid => {
                const invitationRef = doc(db, 'invitations', `${teamId}_${uid}`);
                const invitationDetails = {
                    invitedUid: uid,
                    timestamp: Timestamp.now(),
                    clubId: teamId,
                    state: 'pending',
                };
                return setDoc(invitationRef, invitationDetails);
            });
    
            try {
                await Promise.all(invitationsPromises);
                console.log("Toutes les invitations ont été créées.");
            } catch (error) {
                console.error("Erreur lors de la création des invitations : ", error);
                return;
            }
        } else {
            console.log("Aucun joueur sélectionné pour envoyer une invitation.");
        }
    
        navigateHome();
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
            {filteredPlayers.length > 0 && filteredPlayers.map((player, index) => (
                <TouchableOpacity key={player.uid} onPress={() => selectPlayer(player.uid)}>
                    <Text style={styles.playerItem}>
                        {player.firstname} {player.lastname}
                    </Text>
                </TouchableOpacity>
            ))}
            <SelectedPlayersList selectedPlayers={players.filter(player => selectedPlayerUids.includes(player.uid))} onRemovePlayer={removePlayer} />
            <TouchableOpacity onPress={finishSelection}>
                <Text>Terminer (direction page club)</Text>
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

export default InviteFirstPlayers;