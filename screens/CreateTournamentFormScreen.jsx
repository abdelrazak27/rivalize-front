import { useState } from 'react';
import { Text, TextInput, View, Button, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebaseConfig';
import uuid from 'uuid';
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

function CreateTournamentFormScreen({ route }) {
    const { user } = route.params;
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);

    const [tournamentDetails, setTournamentDetails] = useState({
        id: '',
        name: '',
        place: '',
        playersPerTeam: '5v5',
        category: 'U6',
        gender: 'M',
        availableSlots: '4',
        gameDuration: '30 minutes',
        returnMatches: false,
        matches: initializeMatches('4', false),
        isDisabled: false,
        startDate: new Date(),
        endDate: new Date(),
    });

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
                updateTournamentDates(updatedDetails.matches); 
            }
            return updatedDetails;
        });
    };

    const handleMatchDateChange = (roundIndex, matchIndex, selectedDate) => {
        const newMatches = [...tournamentDetails.matches];
        newMatches[roundIndex].matches[matchIndex].date = selectedDate || newMatches[roundIndex].matches[matchIndex].date;
        handleChange('matches', newMatches);
        updateTournamentDates(newMatches);
    };

    const handleMatchTimeChange = (roundIndex, matchIndex, selectedTime) => {
        const newMatches = [...tournamentDetails.matches];
        newMatches[roundIndex].matches[matchIndex].time = selectedTime || newMatches[roundIndex].matches[matchIndex].time;
        handleChange('matches', newMatches);
        updateTournamentDates(newMatches);
    };

    const updateTournamentDates = (matches) => {
        const allMatchDates = matches.flatMap(round => round.matches.map(match => match.date));
        const allMatchTimes = matches.flatMap(round => round.matches.map(match => match.time));

        const startDate = new Date(Math.min(...allMatchDates));
        
        const combinedEndDateTimes = matches.flatMap(round => 
            round.matches.map(match => new Date(match.date.getFullYear(), match.date.getMonth(), match.date.getDate(), match.time.getHours(), match.time.getMinutes()))
        );

        const endDate = new Date(Math.max(...combinedEndDateTimes));

        handleChange('startDate', startDate);
        handleChange('endDate', endDate);
    };

    const validateFields = () => {
        const requiredFields = ['name', 'place', 'playersPerTeam', 'category', 'availableSlots', 'gameDuration'];
        for (const field of requiredFields) {
            if (!tournamentDetails[field]) {
                return `Le champ "${field}" est obligatoire.`;
            }
        }
        return null;
    };

    const handleSubmit = async () => {
        const validationError = validateFields();
        if (validationError) {
            Alert.alert('Erreur', validationError);
            return;
        }

        const tournamentId = uuid.v4();
        const tournamentData = {
            ...tournamentDetails,
            id: tournamentId,
            createdBy: user.uid,
            startDate: tournamentDetails.startDate.toISOString(),
            endDate: tournamentDetails.endDate.toISOString(),
            matches: tournamentDetails.matches.map(round => ({
                phase: round.phase,
                matches: round.matches.map(match => ({
                    date: match.date.toISOString(),
                    time: match.time.toISOString()
                }))
            })),
            maxSlots: tournamentDetails.availableSlots
        };

        try {
            await setDoc(doc(db, 'tournois', tournamentId), tournamentData);
            const today = new Date();
            const initialSection = tournamentDetails.startDate.toDateString() === today.toDateString() ? 'current' : 'upcoming';
            Alert.alert('Succès', 'Le tournoi a été créé avec succès.', [
                {
                    text: 'OK',
                    onPress: () => {
                        navigation.navigate('TournamentsScreen', { refresh: true, initialSection: initialSection });
                    }
                }
            ]);
        } catch (error) {
            console.error('Erreur lors de la création du tournoi :', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la création du tournoi.');
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

    return (
        <ScrollView style={styles.container}>
            <Text>Créer un tournoi</Text>
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
            <Button title="Soumettre" onPress={handleSubmit} />
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

export default CreateTournamentFormScreen;
