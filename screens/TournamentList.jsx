import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const TournamentList = ({ refresh }) => {
    const [tournaments, setTournaments] = useState([]);
    const navigation = useNavigation();

    const fetchTournaments = async () => {
        const q = query(collection(db, 'tournois'), where('isDisabled', '==', false));
        const querySnapshot = await getDocs(q);
        const loadedTournaments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTournaments(loadedTournaments);
    };

    useEffect(() => {
        fetchTournaments();
    }, [refresh]);

    const handlePress = (tournamentId) => {
        navigation.navigate('TournamentDetailScreen', { tournamentId });
    };

    return (
        <FlatList
            data={tournaments}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
                <TouchableOpacity style={styles.item} onPress={() => handlePress(item.id)}>
                    <Text>{item.name}</Text>
                    <Text>Places restantes : {item.maxSlots - (item.teams ? item.teams.length : 0)}</Text>
                </TouchableOpacity>
            )}
        />
    );
};

const styles = StyleSheet.create({
    item: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    }
});

export default TournamentList;
