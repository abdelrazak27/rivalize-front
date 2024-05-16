import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { collection, query, getDocs, limit, startAfter, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';

function TeamsScreen() {
    const [userTeams, setUserTeams] = useState([]);
    const [allTeams, setAllTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useUser();
    const navigation = useNavigation();
    const [lastVisible, setLastVisible] = useState(null);
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
            setIsMoreLoading(false);
        }
    };
    

    const loadMoreTeams = () => {
        if (!allLoaded && !isMoreLoading) {
            setIsMoreLoading(true);
            fetchTeams();
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
            return "Mes équipes";
        }
        return "Mon équipe";
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchBar}
                placeholder="Recherche par nom de club..."
                value={searchQuery}
                onChangeText={filterTeams}
            />
            <Text style={styles.sectionHeader}>{getTeamSectionTitle()}</Text>
            <FlatList
                data={userTeams}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.teamItem} onPress={() => handleSelectTeam(item.id)}>
                        <Text>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />
            <Text style={styles.sectionHeader}>Toutes les Équipes</Text>
            <FlatList
                data={filteredTeams}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.teamItem} onPress={() => handleSelectTeam(item.id)}>
                        <Text>{item.name}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => 
                    searchQuery.length > 0 && <Text style={styles.noResultsText}>Aucun club ne correspond à votre recherche.</Text>
                }
                onEndReached={loadMoreTeams}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => isMoreLoading && !allLoaded ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : null}
            />
        </View>
    );    
}

const styles = StyleSheet.create({
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
    noResultsText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: 'gray'
    }
});

export default TeamsScreen;
