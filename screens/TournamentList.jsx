import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const TournamentList = ({ refresh, state, showMyTournaments, userId }) => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    const filterTournamentsByState = (loadedTournaments) => {
        const now = new Date();

        switch (state) {
            case 'upcoming':
                return loadedTournaments.filter(tournament => {
                    const startDate = new Date(tournament.startDate);
                    return startDate > now;
                });
            case 'current':
                return loadedTournaments.filter(tournament => {
                    const startDate = new Date(tournament.startDate);
                    const endDate = new Date(tournament.endDate);
                    return startDate <= now && now <= endDate;
                });
            case 'past':
                return loadedTournaments.filter(tournament => {
                    const endDate = new Date(tournament.endDate);
                    return endDate < now;
                });
            default:
                return loadedTournaments;
        }
    };

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            let q = query(collection(db, 'tournois'), where('isDisabled', '==', false));

            if (showMyTournaments) {
                q = query(q, where('createdBy', '==', userId));
            }

            const querySnapshot = await getDocs(q);
            const loadedTournaments = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                startDate: new Date(doc.data().startDate),
                endDate: new Date(doc.data().endDate)
            }));

            const filteredTournaments = filterTournamentsByState(loadedTournaments);

            filteredTournaments.sort((a, b) => b.startDate - a.startDate);

            setTournaments(filteredTournaments);
        } catch (error) {
            console.error("Error fetching tournaments: ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournaments();
    }, [refresh]);

    const handlePress = (tournamentId) => {
        navigation.navigate('TournamentDetailScreen', { tournamentId });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Chargement des tournois...</Text>
            </View>
        );
    }

    if (tournaments.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Aucun tournoi disponible</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={tournaments}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
                <TouchableOpacity style={styles.item} onPress={() => handlePress(item.id)}>
                    <Text>{item.name}</Text>
                    <Text>Places restantes : {item.maxSlots - (item.teams ? item.teams.length : 0)}</Text>
                    <Text>Début du tournoi : {item.startDate.toLocaleDateString()}</Text>
                    <Text>Fin du tournoi : {item.endDate.toLocaleDateString()}</Text>
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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default TournamentList;
