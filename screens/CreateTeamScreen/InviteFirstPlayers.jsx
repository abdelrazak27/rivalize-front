// InviteFirstPlayers.js

import { BackHandler, Text, View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import SelectedPlayersList from "./SelectedPlayersList"; // Importer le nouveau composant

function InviteFirstPlayers() {
    const [players, setPlayers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPlayers, setFilteredPlayers] = useState([]);
    const [selectedPlayerUids, setSelectedPlayerUids] = useState([]);

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

    const finishSelection = () => {
        console.log('Selected Player UIDs:', selectedPlayerUids);
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
