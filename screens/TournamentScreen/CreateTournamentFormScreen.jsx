import { useState, useEffect } from 'react';
import { Text, TextInput, View, Button, StyleSheet, ScrollView, Switch, Alert, Image, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import uuid from 'uuid';
import citiesData from '../../data/citiesFR.json';
import { SafeAreaView } from 'react-native-safe-area-context';
import globalStyles from '../../styles/globalStyles';
import { Label, PrimaryColorText, Title } from '../../components/TextComponents';
import CustomTextInput from '../../components/CustomTextInput';
import colors from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import Spacer from '../../components/Spacer';
import { LinearGradient } from 'expo-linear-gradient';
import { darkenColor } from '../../utils/colors';
import FunctionButton from '../../components/FunctionButton';
import { useLoading } from '../../context/LoadingContext';
import { roundToNextFiveMinutes } from '../../utils/date';
import { db } from '../../firebaseConfig';

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
            matchId: uuid.v4(),
            date: new Date(),
            time: roundToNextFiveMinutes(new Date())
        }))
    }));

    if (returnMatches) {
        totalMatches.forEach(round => {
            round.matches = round.matches.flatMap(match => [
                { ...match },
                { ...match, matchId: uuid.v4() }
            ]);
        });
    }

    return totalMatches;
};

function CreateTournamentFormScreen({ route }) {
    const { user } = route.params;
    const navigation = useNavigation();
    const { setIsLoading } = useLoading();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
    const [currentMatch, setCurrentMatch] = useState({ roundIndex: 0, matchIndex: 0 });
    const [currentMatchDate, setCurrentMatchDate] = useState(new Date());

    const [tournamentDetails, setTournamentDetails] = useState({
        id: '',
        name: '',
        place: '',
        playersPerTeam: '5',
        category: 'U6',
        gender: 'M',
        availableSlots: 4,
        gameDuration: '30 minutes',
        returnMatches: false,
        matches: initializeMatches('4', false),
        isDisabled: false,
        startDate: new Date(),
        endDate: new Date(),
        participatingClubs: []
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

    const handleMatchDateChange = (selectedDate) => {
        const newMatches = [...tournamentDetails.matches];
        newMatches[currentMatch.roundIndex].matches[currentMatch.matchIndex].date = selectedDate || newMatches[currentMatch.roundIndex].matches[currentMatch.matchIndex].date;
        handleChange('matches', newMatches);
        updateTournamentDates(newMatches);
        setCurrentMatchDate(selectedDate || newMatches[currentMatch.roundIndex].matches[currentMatch.matchIndex].date);
        setDatePickerVisibility(false);
    };

    const handleMatchTimeChange = (selectedTime) => {
        const newMatches = [...tournamentDetails.matches];
        newMatches[currentMatch.roundIndex].matches[currentMatch.matchIndex].time = selectedTime || newMatches[currentMatch.roundIndex].matches[currentMatch.matchIndex].time;
        handleChange('matches', newMatches);
        updateTournamentDates(newMatches);
        setTimePickerVisibility(false);
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
        const fieldLabels = {
            name: 'Nom du tournoi',
            place: 'Commune',
            playersPerTeam: 'Nombre de joueurs par équipe',
            category: 'Catégorie',
            availableSlots: 'Nombre de places',
            gameDuration: 'Temps de jeu'
        };

        const requiredFields = ['name', 'place', 'playersPerTeam', 'category', 'availableSlots', 'gameDuration'];
        for (const field of requiredFields) {
            if (!tournamentDetails[field]) {
                return `Le champ "${fieldLabels[field]}" est obligatoire.`;
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
                    matchId: match.matchId,
                    date: match.date.toISOString(),
                    time: match.time.toISOString()
                }))
            })),
            maxSlots: tournamentDetails.availableSlots
        };

        try {
            setIsLoading(true);
            await setDoc(doc(db, 'tournois', tournamentId), tournamentData);
            const today = new Date();
            const initialSection = tournamentDetails.startDate.toDateString() === today.toDateString() ? 'current' : 'upcoming';
            navigation.navigate('TournamentsScreen', { refresh: true, initialSection: initialSection });
            setIsLoading(false);
            Alert.alert('Succès', 'Le tournoi a été créé avec succès.');
        } catch (error) {
            setIsLoading(false);
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

    const isToday = (someDate) => {
        const today = new Date();
        return someDate.getDate() === today.getDate() && someDate.getMonth() === today.getMonth() && someDate.getFullYear() === today.getFullYear();
    };

    const showDatePicker = (roundIndex, matchIndex) => {
        setCurrentMatch({ roundIndex, matchIndex });
        setDatePickerVisibility(true);
    };

    const showTimePicker = (roundIndex, matchIndex) => {
        const matchDate = tournamentDetails.matches[roundIndex].matches[matchIndex].date;
        setCurrentMatch({ roundIndex, matchIndex });
        setCurrentMatchDate(matchDate);
        setTimePickerVisibility(true);
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={globalStyles.headerContainerWithNoBorderBottom}>
                <Title>Créez <PrimaryColorText>votre tournoi</PrimaryColorText></Title>
            </View>
            <ScrollView
                contentContainerStyle={globalStyles.scrollContainer}
            >
                <CustomTextInput
                    label="Nom du tournoi"
                    placeholder="Saisissez le nom du tournoi"
                    value={tournamentDetails.name}
                    onChangeText={(text) => handleChange('name', text)}
                />
                <View style={{ paddingTop: 15 }}>
                    <Label>Catégorie</Label>
                    <Picker
                        selectedValue={tournamentDetails.category}
                        onValueChange={(itemValue) => handleChange('category', itemValue)}
                    >
                        {categories.map((category, index) => (
                            <Picker.Item key={index} label={category} value={category} />
                        ))}
                    </Picker>
                </View>
                <View style={styles.cities}>
                    <CustomTextInput
                        label="Commune"
                        placeholder="Cherchez votre commune"
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
                                        style={styles.city}
                                    >
                                        {nomCommune}
                                    </Text>
                                ))}
                        </View>
                    )}
                </View>
                <View style={{ paddingTop: 15 }}>
                    <Label>Temps de jeu</Label>
                    <Picker
                        selectedValue={tournamentDetails.gameDuration}
                        onValueChange={(itemValue) => handleChange('gameDuration', itemValue)}
                    >
                        <Picker.Item label="30 minutes" value="30 minutes" />
                        <Picker.Item label="60 minutes" value="60 minutes" />
                        <Picker.Item label="90 minutes" value="90 minutes" />
                    </Picker>
                </View>
                <View style={{ paddingTop: 15 }}>
                    <Label>Nombre de joueurs par équipe</Label>
                    <Picker
                        selectedValue={tournamentDetails.playersPerTeam}
                        onValueChange={(itemValue) => handleChange('playersPerTeam', itemValue)}
                    >
                        <Picker.Item label="3v3" value="3" />
                        <Picker.Item label="4v4" value="4" />
                        <Picker.Item label="5v5" value="5" />
                        <Picker.Item label="11v11" value="11" />
                    </Picker>
                </View>
                <View style={{ paddingTop: 15 }}>
                    <Label>Nombre de places</Label>
                    <Picker
                        selectedValue={tournamentDetails.availableSlots}
                        onValueChange={(itemValue) => handleChange('availableSlots', itemValue)}
                    >
                        <Picker.Item label="4 équipes" value="4" />
                        <Picker.Item label="8 équipes" value="8" />
                        <Picker.Item label="16 équipes" value="16" />
                        <Picker.Item label="32 équipes" value="32" />
                    </Picker>
                </View>
                <View style={styles.checkboxContainer}>
                    <Switch
                        value={tournamentDetails.returnMatches}
                        onValueChange={(value) => handleChange('returnMatches', value)}
                        trackColor={{ true: colors.primary }}
                        style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                    />
                    <Text style={[styles.textCheckbox, { color: tournamentDetails.returnMatches ? colors.primary : colors.secondary }]}>
                        Matchs retours
                    </Text>
                </View>
                <Spacer top={10} />
                <View style={styles.matchsContainer}>
                    <Text style={styles.matchsTitle}>Matchs</Text>
                </View>
                {tournamentDetails.matches.map((round, roundIndex) => (
                    <View key={roundIndex} style={styles.roundContainer}>
                        <Text style={styles.roundTitle}>{round.phase}</Text>
                        {round.matches.map((match, matchIndex) => (
                            <LinearGradient
                                key={matchIndex}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                colors={[darkenColor(colors.primary, -20), colors.primary]}
                                locations={[0.3, 1]}
                                style={{ borderRadius: 10 }}
                            >

                                <View key={matchIndex} style={styles.matchContainer}>
                                    <View style={styles.matchInfoClubLeft}>
                                        <Image
                                            source={require('../../assets/images/clubTeamEmpty.png')}
                                            style={styles.matchInfoClubImage}
                                        />
                                    </View>
                                    <View style={styles.matchInfoClubMid}>
                                        <Text style={styles.matchInfoClubMidText}>Match  {matchIndex + 1}</Text>
                                        <TouchableOpacity onPress={() => showDatePicker(roundIndex, matchIndex)} style={styles.datePickerContainer}>
                                            <Text style={styles.datePickerText}>
                                                {match.date.toLocaleDateString()}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => showTimePicker(roundIndex, matchIndex)} style={styles.datePickerContainer}>
                                            <Text style={styles.datePickerText}>
                                                {`${match.time.getHours()}:${match.time.getMinutes().toString().padStart(2, '0')}`}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.matchInfoClubRight}>
                                        <Image
                                            source={require('../../assets/images/clubTeamEmpty.png')}
                                            style={styles.matchInfoClubImage}
                                        />
                                    </View>
                                </View>
                            </LinearGradient>
                        ))}
                    </View>
                ))}
                <Spacer />
                <FunctionButton
                    title="Créer mon tournoi"
                    onPress={handleSubmit}
                />
                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleMatchDateChange}
                    onCancel={() => setDatePickerVisibility(false)}
                    minimumDate={new Date()}
                    headerTextIOS="Choisissez une date"
                    confirmTextIOS="Confirmer"
                    cancelTextIOS="Annuler"
                />
                <DateTimePickerModal
                    isVisible={isTimePickerVisible}
                    mode="time"
                    onConfirm={handleMatchTimeChange}
                    onCancel={() => setTimePickerVisibility(false)}
                    minimumDate={isToday(currentMatchDate) ? roundToNextFiveMinutes(new Date()) : undefined}
                    headerTextIOS="Choisissez une heure"
                    confirmTextIOS="Confirmer"
                    cancelTextIOS="Annuler"
                    minuteInterval={5}
                />
            </ScrollView>
        </SafeAreaView>
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
        gap: 5,
        marginTop: 5,
        width: '100%',
    },
    city: {
        padding: 11,
        borderWidth: 2,
        borderRadius: 8,
        borderColor: colors.secondary,
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
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        gap: 15,
    },
    textCheckbox: {
        fontSize: 16,
        fontFamily: fonts.OutfitSemiBold,
        color: colors.secondary
    },
    matchsContainer: {
        borderRadius: 10,
    },
    matchsTitle: {
        fontSize: 16,
        textTransform: 'uppercase',
        fontFamily: fonts.OutfitBold,
        color: colors.primary,
        textAlign: 'center',
    },
    roundContainer: {
        marginVertical: 15,
        gap: 20,
    },
    roundTitle: {
        fontSize: 14,
        textAlign: 'center',
        fontFamily: fonts.OutfitSemiBold,
        color: colors.darkgrey
    },
    matchInfoClubLeft: {
        paddingHorizontal: 10
    },
    matchInfoClubRight: {
        paddingHorizontal: 10
    },
    matchInfoClubImage: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
        borderRadius: 10,
    },
    matchInfoClubMid: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },
    matchInfoClubMidText: {
        color: 'white',
        fontFamily: fonts.OutfitBold,
        textTransform: 'uppercase',
    },
    datePickerContainer: {
        backgroundColor: 'white',
        paddingHorizontal: 10,
        borderRadius: 8
    },
    datePickerText: {
        color: 'black',
        fontFamily: fonts.OutfitBold,
        fontSize: 16,
        paddingVertical: 5,
    }
});

export default CreateTournamentFormScreen;