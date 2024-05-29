import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import CustomList from '../components/CustomList';
import ItemList from '../components/ItemList';
import { fonts } from '../styles/fonts';
import colors from '../styles/colors';
import { useLoading } from '../context/LoadingContext';

const TournamentList = ({ refresh, state, showMyTournaments, userId, searchQuery }) => {
    const { user } = useUser();
    const [tournaments, setTournaments] = useState([]);
    const [filteredTournaments, setFilteredTournaments] = useState([]);
    const navigation = useNavigation();
    const { setIsLoading } = useLoading();

    const filterTournamentsByStateAndName = (loadedTournaments, searchQuery) => {
        const now = new Date();
        let filteredByState = [];

        switch (state) {
            case 'upcoming':
                filteredByState = loadedTournaments.filter(tournament => new Date(tournament.startDate) > now);
                break;
            case 'current':
                filteredByState = loadedTournaments.filter(tournament => {
                    const startDate = new Date(tournament.startDate);
                    const endDate = new Date(tournament.endDate);
                    return startDate <= now && now <= endDate;
                });
                break;
            case 'past':
                filteredByState = loadedTournaments.filter(tournament => new Date(tournament.endDate) < now);
                break;
            default:
                filteredByState = loadedTournaments;
        }

        if (searchQuery && searchQuery.length > 0) {
            return filteredByState.filter(tournament =>
                tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filteredByState;
    };

    const getUserTeamIds = () => {
        if (user.teams) {
            return user.teams;
        } else if (user.team) {
            return [user.team];
        }
        return [];
    };

    const fetchTournaments = async () => {
        setIsLoading(true);
        try {
            const userTeamIds = getUserTeamIds();
            let queries = [];

            if (showMyTournaments) {
                queries.push(query(collection(db, 'tournois'), where('createdBy', '==', userId)));
                if (userTeamIds.length > 0) {
                    queries.push(query(collection(db, 'tournois'), where('participatingClubs', 'array-contains-any', userTeamIds)));
                }
            } else {
                queries.push(query(collection(db, 'tournois'), where('isDisabled', '==', false)));
            }

            let loadedTournaments = [];

            for (let q of queries) {
                const querySnapshot = await getDocs(q);
                loadedTournaments = loadedTournaments.concat(querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    startDate: new Date(doc.data().startDate),
                    endDate: new Date(doc.data().endDate)
                })));
            }

            loadedTournaments = loadedTournaments.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
            loadedTournaments.sort((a, b) => b.startDate - a.startDate);
            setTournaments(loadedTournaments);

            const filteredTournaments = filterTournamentsByStateAndName(loadedTournaments, searchQuery);
            setFilteredTournaments(filteredTournaments);
        } catch (error) {
            console.error("Error fetching tournaments: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTournaments();
    }, [refresh]);

    useEffect(() => {
        const filteredTournaments = filterTournamentsByStateAndName(tournaments, searchQuery);
        setFilteredTournaments(filteredTournaments);
    }, [searchQuery, state, tournaments]);

    const handlePress = (tournamentId) => {
        navigation.navigate('TournamentDetailScreen', { tournamentId });
    };

    if (filteredTournaments.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                {searchQuery.length > 0 ? (
                    <Text style={styles.noTournamentsFound}>Aucun tournoi correspondant aux critères n'est disponible</Text>
                ) : (
                    <Text style={styles.noTournamentsFound}>
                        {user.accountType === 'coach' 
                            ? "Aucun tournoi pour cette période, n'hésitez pas à en créer un."
                            : "Aucun tournoi pour cette période."
                        }
                    </Text>
                )}
            </View>
        );
    }

    return (
        <CustomList>
            {filteredTournaments.map(tournament => (
                <ItemList 
                    key={tournament.id} 
                    text={
                        <>
                            <Text style={styles.nameTournament}>{tournament.name}</Text>
                            {"\n"}
                            <Text style={styles.infoTournament}>Place(s) restante(s) : {tournament.availableSlots}</Text>
                            {"\n"}
                            <Text style={styles.infoTournament}>Du {tournament.startDate.toLocaleDateString()} au {tournament.endDate.toLocaleDateString()}</Text>
                        </>
                    }
                    onPress={() => handlePress(tournament.id)} 
                />
            ))}
        </CustomList>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noTournamentsFound: {
        textAlign: 'center',
        fontFamily: fonts.OutfitSemiBold,
        color: colors.secondary,
        fontSize: 16
    },
    nameTournament: {
        fontFamily: fonts.OutfitBold,
    },
    infoTournament: {
        fontFamily: fonts.OutfitRegular,
    }
});

export default TournamentList;
