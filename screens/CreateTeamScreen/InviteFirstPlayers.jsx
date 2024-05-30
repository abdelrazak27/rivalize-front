import { BackHandler, Text, View, StyleSheet, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, Timestamp, setDoc, doc } from "firebase/firestore";
import SelectedPlayersList from "./SelectedPlayersList";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import { useUser } from "../../context/UserContext";
import uuid from 'react-native-uuid';
import { SafeAreaView } from "react-native-safe-area-context";
import { Subtitle, Title } from "../../components/TextComponents";
import globalStyles from "../../styles/globalStyles";
import CustomTextInput from "../../components/CustomTextInput";
import CustomList from "../../components/CustomList";
import ItemList from "../../components/ItemList";
import FunctionButton from "../../components/FunctionButton";
import { fonts } from "../../styles/fonts";
import colors from "../../styles/colors";
import { useLoading } from "../../context/LoadingContext";

function InviteFirstPlayers() {
    const [players, setPlayers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPlayers, setFilteredPlayers] = useState([]);
    const [selectedPlayerUids, setSelectedPlayerUids] = useState([]);
    const navigation = useNavigation();
    const route = useRoute();
    const { teamId } = route.params;
    const { setUser } = useUser();
    const { setIsLoading } = useLoading();

    useEffect(() => {
        setIsLoading(true);
        const q = query(collection(db, "utilisateurs"), where("accountType", "==", "player"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const playersArray = [];
            querySnapshot.forEach((doc) => {
                playersArray.push({ uid: doc.id, ...doc.data() });
            });
            setPlayers(playersArray);
            setIsLoading(false);
        });
    
        return () => unsubscribe();
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
        setIsLoading(true);
        console.log('Selected Player UIDs:', selectedPlayerUids);
        addTeamToCoach(teamId);
    
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
                setIsLoading(false);
                return;
            }
        } else {
            console.log("Aucun joueur sélectionné pour envoyer une invitation.");
        }
    
        setIsLoading(false);
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
        <SafeAreaView style={globalStyles.container}>
            <View style={globalStyles.headerContainer}>
                <Title>Que l'aventure commence,</Title>
                <Subtitle>Invitez votre ou vos premiers joueurs</Subtitle>
            </View>
            <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
                <CustomTextInput
                    label="Rechercher un joueur"
                    placeholder="Recherche par nom ou prénom..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />

                {filteredPlayers.length > 0 ? (
                    <View style={{ paddingTop: 15 }}>
                        <CustomList>
                            {filteredPlayers.map((player) => (
                                <ItemList
                                    key={player.uid}
                                    text={`${player.firstname} ${player.lastname}`}
                                    onPress={() => selectPlayer(player.uid)}
                                />
                            ))}
                        </CustomList>
                    </View>
                ) : searchQuery.length > 0 && (
                    <Text style={styles.noResultsText}>Aucun utilisateur trouvé</Text>
                )}

                {players.filter(player => selectedPlayerUids.includes(player.uid)).length > 0 && (
                    <SelectedPlayersList selectedPlayers={players.filter(player => selectedPlayerUids.includes(player.uid))} onRemovePlayer={removePlayer} />
                )}
            </ScrollView>
            <View style={styles.footer}>
                <FunctionButton
                    title={players.filter(player => selectedPlayerUids.includes(player.uid)).length === 0 ? "Passer" : "Terminer"}
                    onPress={finishSelection}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    noResultsText: {
        textAlign: 'center',
        marginTop: 20,
        fontFamily: fonts.OutfitSemiBold,
        color: colors.darkgrey
    },
    footer: {
        marginHorizontal: 30,
        bottom: 0,
        paddingTop: 25,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: colors.lightgrey,
    },
});

export default InviteFirstPlayers;
