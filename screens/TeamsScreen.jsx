import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { collection, query, getDocs, limit, startAfter, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryColorText, Subtitle, Title } from '../components/TextComponents';
import CustomTextInput from '../components/CustomTextInput';
import CustomList from '../components/CustomList';
import ItemList from '../components/ItemList';
import globalStyles from '../styles/globalStyles';
import { fonts } from '../styles/fonts';
import colors from '../styles/colors';
import Spacer from '../components/Spacer';
import { useLoading } from '../context/LoadingContext';

function TeamsScreen() {
    const [userTeams, setUserTeams] = useState([]);
    const [allTeams, setAllTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useUser();
    const navigation = useNavigation();
    const [lastVisible, setLastVisible] = useState(null);
    const { setIsLoading } = useLoading();
    const [isMoreLoading, setIsMoreLoading] = useState(false);
    const [allLoaded, setAllLoaded] = useState(false);

    useEffect(() => {
        fetchTeams();
    }, []);

    useEffect(() => {
        filterTeams(searchQuery);
    }, [searchQuery, allTeams]);

    const fetchTeams = async () => {
        try {
            setIsLoading(true);
            let q = query(collection(db, 'equipes'), where("active", "==", true), limit(20));
            if (lastVisible) {
                q = query(collection(db, 'equipes'), where("active", "==", true), startAfter(lastVisible), limit(20));
            }
            const querySnapshot = await getDocs(q);
            const loadedTeams = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            if (querySnapshot.docs.length < 20) {
                setAllLoaded(true);
            }
            setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);

            const userTeamIds = user.teams ? user.teams : [user.team];
            setUserTeams(prevTeams => prevTeams.concat(loadedTeams.filter(team => userTeamIds.includes(team.id))));
            setAllTeams(prevTeams => prevTeams.concat(loadedTeams.filter(team => !userTeamIds.includes(team.id))));
            setFilteredTeams(prevTeams => prevTeams.concat(loadedTeams.filter(team => !userTeamIds.includes(team.id))));

        } catch (error) {
            console.error("Error fetching teams: ", error);
        } finally {
            setIsLoading(false);
            setIsMoreLoading(false);
        }
    };

    const filterTeams = (text) => {
        setSearchQuery(text);
        if (text) {
            const filtered = allTeams.filter(team => team.name.toLowerCase().includes(text.toLowerCase()));
            setFilteredTeams(filtered);
        } else {
            setFilteredTeams(allTeams);
        }
    };

    const handleSelectTeam = (teamId) => {
        navigation.navigate('TeamScreen', { teamId });
    };

    const getTeamSectionTitle = () => {
        if (user.teams && user.teams.length > 1) {
            return "Mes clubs";
        }
        return "Mon club";
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={[globalStyles.headerContainer, { paddingBottom: 25, marginBottom: 25 }]}>
                <Title>Les <PrimaryColorText>clubs</PrimaryColorText></Title>
                <Subtitle>Retrouvez leurs informations en cliquant sur l’une d’elles parmi la liste ci-dessous</Subtitle>
                <View style={{ height: 15 }}></View>
                <CustomTextInput
                    label="Rechercher un club par son nom"
                    placeholder="Recherche par nom de club..."
                    value={searchQuery}
                    onChangeText={filterTeams}
                />
            </View>
            <ScrollView style={{ paddingHorizontal: 30 }}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{getTeamSectionTitle()}</Text>
                    {userTeams.length === 0 && (
                        <Text style={styles.sectionSubtitle}>Vous ne possédez pas de club pour le moment.</Text>
                    )}
                    <View style={{ paddingTop: 10 }}>
                        <CustomList>
                            {userTeams.map((team, index) => (
                                <ItemList
                                    key={index}
                                    text={team.name}
                                    onPress={() => handleSelectTeam(team.id)}
                                />
                            ))}
                        </CustomList>
                    </View>
                </View>
                <Spacer />
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tous les clubs</Text>
                    <View style={{ paddingTop: 10 }}>
                        <CustomList>
                            {filteredTeams.length > 0 && (
                                filteredTeams.map((team, index) => (
                                    <ItemList
                                        key={index}
                                        text={team.name}
                                        onPress={() => handleSelectTeam(team.id)}
                                    />
                                ))
                            )}
                            {searchQuery.length === 0 && filteredTeams.length === 0 && (
                                <Text style={styles.noResultsText}>Aucun club n'existe pour le moment.</Text>
                            )}
                            {isMoreLoading && !allLoaded && (
                                <ActivityIndicator size="large" color="#0000ff" />
                            )}
                        </CustomList>
                    </View>
                </View>
                {searchQuery.length > 0 && filteredTeams.length === 0 && (
                    <Text style={styles.noResultsText}>Aucun club ne correspond à votre recherche.</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
        fontFamily: fonts.OutfitSemiBold,
        color: colors.primary,
    },
    container: {
        flex: 1,
        padding: 10,
    },
    searchBar: {
        padding: 10,
        marginBottom: 20,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
    },
    teamItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
    },
    section: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
    },
    sectionTitle: {
        fontSize: 15,
        fontFamily: fonts.OutfitBold,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: fonts.OutfitSemiBold,
        color: colors.secondary,
        marginBottom: 5,
    },
    noResultsText: {
        textAlign: 'center',
        marginTop: 20,
        fontFamily: fonts.OutfitSemiBold,
        color: colors.darkgrey
    }
});

export default TeamsScreen;
