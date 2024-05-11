import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import citiesData from '../data/citiesFR.json';

const categories = [
    'U6', 'U6 F', 'U7', 'U7 F', 'U8', 'U8 F', 'U9', 'U9 F', 'U10', 'U10 F',
    'U11', 'U11 F', 'U12', 'U12 F', 'U13', 'U13 F', 'U14', 'U14 F', 'U15', 'U15 F',
    'U16', 'U16 F', 'U17', 'U17 F', 'U18', 'U18 F', 'U19', 'U19 F', 'U20', 'U20 F',
    'SENIOR', 'SENIOR F', 'SENIOR VETERAN'
];

const getPhaseName = (roundIndex, totalRounds) => {
    if (roundIndex === totalRounds - 1) return 'Finale';
    if (roundIndex === totalRounds - 2) return 'Demi-finales';
    if (roundIndex === totalRounds - 3) return 'Quarts de finale';
    if (roundIndex === totalRounds - 4) return 'Huitièmes de finale';
    if (roundIndex === totalRounds - 5) return 'Seizièmes de finale';
    return `Tour ${totalRounds - roundIndex}`;
};

const initializeMatches = (slots, returnMatches) => {
    const numberOfTeams = parseInt(slots);
    const numberOfRounds = Math.log2(numberOfTeams);
    const totalMatches = Array.from({ length: numberOfRounds }, (_, round) => ({
        phase: getPhaseName(round, numberOfRounds),
        matches: Array.from({ length: Math.pow(2, numberOfRounds - round - 1) }, () => ({
            date: new Date(),
            time: new Date()
        }))
    }));

    if (returnMatches) {
        totalMatches.forEach(round => {
            round.matches = round.matches.flatMap(match => [
                { ...match },
                { ...match }
            ]);
        });
    }

    return totalMatches;
};

function EditTournamentFormScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { tournamentId } = route.params;
    const [initialTournamentDetails, setInitialTournamentDetails] = useState(null);
    const [tournamentDetails, setTournamentDetails] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);

    useEffect(() => {
        const fetchTournament = async () => {
            const docRef = doc(db, 'tournois', tournamentId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const formattedData = {
                    ...data,
                    matches: data.matches.map(round => ({
                        ...round,
                        matches: round.matches.map(match => ({
                            date: new Date(match.date),
                            time: new Date(match.time)
                        }))
                    }))
                };
                setInitialTournamentDetails(formattedData);
                setTournamentDetails(formattedData);
            }
        };
        fetchTournament();
    }, [tournamentId]);

    const handleChange = (name, value) => {
        setTournamentDetails((prevDetails) => {
            const updatedDetails = { ...prevDetails, [name]: value };
            if (name === 'category') {
                updatedDetails.gender = value.endsWith('F') ? 'F' : 'M';
            }
            if (name === 'availableSlots' || name === 'returnMatches') {
                updatedDetails.matches = initializeMatches(
                    name === 'availableSlots' ? value : updatedDetails.availableSlots,
                    name === 'returnMatches' ? value : updatedDetails.returnMatches
                );
            }
            return updatedDetails;
        });
    };

    const handleMatchDateChange = (roundIndex, matchIndex, selectedDate) => {
        const newMatches = [...tournamentDetails.matches];
        newMatches[roundIndex].matches[matchIndex].date = selectedDate || newMatches[roundIndex].matches[matchIndex].date;
        handleChange('matches', newMatches);
    };

    const handleMatchTimeChange = (roundIndex, matchIndex, selectedTime) => {
        const newMatches = [...tournamentDetails.matches];
        newMatches[roundIndex].matches[matchIndex].time = selectedTime || newMatches[roundIndex].matches[matchIndex].time;
        handleChange('matches', newMatches);
    };

    const handleSubmit = async () => {
        try {
            await updateDoc(doc(db, 'tournois', tournamentId), {
                ...tournamentDetails,
                matches: tournamentDetails.matches.map(round => ({
                    phase: round.phase,
                    matches: round.matches.map(match => ({
                        date: match.date.toISOString(),
                        time: match.time.toISOString()
                    }))
                }))
            });
            Alert.alert('Succès', 'Le tournoi a été modifié avec succès.', [
                {
                    text: 'OK',
                    onPress: () => {
                        navigation.navigate({
                            name: 'TournamentDetailScreen',
                            params: { refresh: true },
                            merge: true,
                        });
                    }
                }
            ]);
        } catch (error) {
            console.error('Erreur lors de la modification du tournoi :', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la modification du tournoi.');
        }
    };

    const handleCancel = () => {
        if (initialTournamentDetails) {
            setTournamentDetails({ ...initialTournamentDetails });
        }
    };

    const filterCities = (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setFilteredCities([]);
            return;
        }
        const filtered = citiesData
            .filter((city) => city.Nom_commune.toUpperCase().startsWith(query.toUpperCase()))
            .slice(0, 10);
        setFilteredCities(filtered);
    };

    const hasChanges = () => {
        return JSON.stringify(tournamentDetails) !== JSON.stringify(initialTournamentDetails);
    };

    if (!tournamentDetails) {
        return <Text>Chargement...</Text>;
    }

    return (
        <ScrollView style={styles.container}>
            <Text>Modifier le tournoi</Text>
            <TextInput
                placeholder="Nom du tournoi *"
                value={tournamentDetails.name}
                onChangeText={(text) => handleChange('name', text)}
            />
            <View style={styles.cities}>
                <TextInput
                    placeholder="Rechercher une ville *"
                    value={tournamentDetails.place ? tournamentDetails.place : searchQuery}
                    onChangeText={(text) => {
                        setSearchQuery(text);
                        handleChange('place', text);
                        filterCities(text);
                    }}
                />
                {filteredCities.length > 0 && (
                    <View style={styles.citiesList}>
                        {Array.from(new Set(filteredCities.map(city => city.Nom_commune)))
                            .map((nomCommune, index) => (
                                <Text
                                    key={index}
                                    onPress={() => {
                                        handleChange('place', nomCommune);
                                        setFilteredCities([]);
                                        setSearchQuery(nomCommune);
                                    }}
                                    style={{ padding: 10 }}
                                >
                                    {nomCommune}
                                </Text>
                            ))}
                    </View>
                )}
            </View>
            <Text>Nombre de joueurs par équipe :</Text>
            <Picker
                selectedValue={tournamentDetails.playersPerTeam}
                onValueChange={(itemValue) => handleChange('playersPerTeam', itemValue)}
            >
                <Picker.Item label="3v3" value="3" />
                <Picker.Item label="4v4" value="4" />
                <Picker.Item label="5v5" value="5" />
                <Picker.Item label="11v11" value="11" />
            </Picker>
            <Text>Niveau :</Text>
            <Picker
                selectedValue={tournamentDetails.category}
                onValueChange={(itemValue) => handleChange('category', itemValue)}
            >
                {categories.map((category, index) => (
                    <Picker.Item key={index} label={category} value={category} />
                ))}
            </Picker>
            <Text>Genre : {tournamentDetails.gender === 'F' ? 'Féminin' : 'Masculin'}</Text>
            <Text>Nombre de places disponibles :</Text>
            <Picker
                selectedValue={tournamentDetails.availableSlots}
                onValueChange={(itemValue) => handleChange('availableSlots', itemValue)}
            >
                <Picker.Item label="4 équipes" value="4" />
                <Picker.Item label="8 équipes" value="8" />
                <Picker.Item label="16 équipes" value="16" />
                <Picker.Item label="32 équipes" value="32" />
            </Picker>
            <Text>Matchs retours :</Text>
            <Switch
                value={tournamentDetails.returnMatches}
                onValueChange={(value) => handleChange('returnMatches', value)}
            />
            {tournamentDetails.matches.map((round, roundIndex) => (
                <View key={roundIndex} style={styles.roundContainer}>
                    <Text>{round.phase}</Text>
                    {round.matches.map((match, matchIndex) => (
                        <View key={matchIndex} style={styles.matchContainer}>
                            <Text>Match {matchIndex + 1}</Text>
                            <Text>Date :</Text>
                            <DateTimePicker
                                value={match.date}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => handleMatchDateChange(roundIndex, matchIndex, selectedDate)}
                                minimumDate={new Date()}
                            />
                            <Text>Heure :</Text>
                            <DateTimePicker
                                value={match.time}
                                mode="time"
                                display="default"
                                onChange={(event, selectedTime) => handleMatchTimeChange(roundIndex, matchIndex, selectedTime)}
                                minimumDate={new Date()}
                            />
                        </View>
                    ))}
                </View>
            ))}
            <Text>Temps de jeu :</Text>
            <Picker
                selectedValue={tournamentDetails.gameDuration}
                onValueChange={(itemValue) => handleChange('gameDuration', itemValue)}
            >
                <Picker.Item label="30 minutes" value="30 minutes" />
                <Picker.Item label="60 minutes" value="60 minutes" />
                <Picker.Item label="90 minutes" value="90 minutes" />
            </Picker>
            <Button
                title="Soumettre"
                onPress={handleSubmit}
                disabled={!hasChanges()}
            />
            <Button
                title="Annuler les modifications"
                onPress={handleCancel}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    cities: {
        marginBottom: 20,
    },
    citiesList: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        maxHeight: 150,
    },
    roundContainer: {
        marginBottom: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
    },
    matchContainer: {
        marginBottom: 10,
    }
});

export default EditTournamentFormScreen;
