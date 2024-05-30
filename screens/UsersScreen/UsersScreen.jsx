import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { collection, getDocs, limit, query, startAfter } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import globalStyles from '../../styles/globalStyles';
import { PrimaryColorText, Subtitle, Title } from '../../components/TextComponents';
import CustomTextInput from '../../components/CustomTextInput';
import CustomList from '../../components/CustomList';
import ItemList from '../../components/ItemList';
import { fonts } from '../../styles/fonts';
import colors from '../../styles/colors';
import { useLoading } from '../../context/LoadingContext';

function UsersScreen() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);
    const [isMoreLoading, setIsMoreLoading] = useState(false);
    const [lastVisible, setLastVisible] = useState(null);
    const [allLoaded, setAllLoaded] = useState(false);
    const navigation = useNavigation();
    const { setIsLoading } = useLoading();

    useEffect(() => {
        fetchUsers(true);
    }, []);

    useEffect(() => {
        filterUsers(searchQuery);
    }, [searchQuery, users]);

    const fetchUsers = async (initial = false) => {
        if (initial) {
            setIsLoading(true);
        } else {
            setIsMoreLoading(true);
        }

        try {
            let q = query(collection(db, 'utilisateurs'), limit(20));
            if (lastVisible && !initial) {
                q = query(collection(db, 'utilisateurs'), startAfter(lastVisible), limit(20));
            }
            const querySnapshot = await getDocs(q);
            const loadedUsers = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            if (querySnapshot.docs.length < 20) {
                setAllLoaded(true);
            }
            setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);

            if (initial) {
                setUsers(loadedUsers);
                setFilteredUsers(loadedUsers);
            } else {
                setUsers(prevUsers => [...prevUsers, ...loadedUsers]);
                setFilteredUsers(prevUsers => [...prevUsers, ...loadedUsers]);
            }
        } catch (error) {
            console.error("Error fetching users: ", error);
        } finally {
            setIsLoading(false);
            setIsMoreLoading(false);
        }
    };

    const filterUsers = (text) => {
        setSearchQuery(text);
        if (text) {
            const filtered = users.filter(user =>
                user.firstname.toLowerCase().includes(text.toLowerCase()) ||
                user.lastname.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    };

    const handleSelectUser = (userId) => {
        navigation.navigate('ProfileScreen', { userId });
    };

    const handleLoadMore = () => {
        if (!allLoaded && !isMoreLoading) {
            fetchUsers(false);
        }
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={[globalStyles.headerContainer, { paddingBottom: 25, marginBottom: 25 }]}>
                <Title>Nos <PrimaryColorText>utilisateurs</PrimaryColorText></Title>
                <Subtitle>Retrouvez leurs informations en cliquant sur l’un d’eux parmi la liste ci-dessous</Subtitle>
                <View style={{ height: 15 }}></View>
                <CustomTextInput
                    label="Rechercher un utilisateur en particulier"
                    placeholder="Recherche par nom ou prénom..."
                    value={searchQuery}
                    onChangeText={filterUsers}
                />
            </View>
            <ScrollView
                contentContainerStyle={globalStyles.scrollContainer}
                onScroll={({ nativeEvent }) => {
                    if (isCloseToBottom(nativeEvent)) {
                        handleLoadMore();
                    }
                }}
                scrollEventThrottle={400}
            >
                {filteredUsers.length > 0 ? (
                    <CustomList>
                        {filteredUsers.map(user => (
                            <ItemList
                                key={user.id}
                                text={`${user.firstname} ${user.lastname}`}
                                onPress={() => handleSelectUser(user.id)}
                            />
                        ))}
                        {isMoreLoading && (
                            <ActivityIndicator size="large" color="#0000ff" />
                        )}
                    </CustomList>
                ) : (
                    <Text style={styles.noResultsText}>Aucun utilisateur trouvé</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const paddingToBottom = 20;
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
};

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
    item: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noResultsText: {
        textAlign: 'center',
        marginTop: 20,
        fontFamily: fonts.OutfitSemiBold,
        color: colors.darkgrey
    }
});

export default UsersScreen;
