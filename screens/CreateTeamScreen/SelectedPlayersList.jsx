// SelectedPlayersList.js

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const SelectedPlayersList = ({ selectedPlayers, onRemovePlayer }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Joueurs Sélectionnés :</Text>
            {selectedPlayers.map((player, index) => (
                <View key={index} style={styles.playerContainer}>
                    <Text style={styles.playerItem}>
                        {player.firstname} {player.lastname}
                    </Text>
                    <TouchableOpacity onPress={() => onRemovePlayer(player.uid)}>
                        <Text style={styles.removeButton}>X</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    playerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    playerItem: {
        fontSize: 16,
        marginRight: 10,
    },
    removeButton: {
        fontSize: 16,
        color: "red",
    },
});

export default SelectedPlayersList;
