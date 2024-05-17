import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, getDocs, limit, query, startAfter } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

function UsersScreen() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const [lastVisible, setLastVisible] = useState(null);
    const [isMoreLoading, setIsMoreLoading] = useState(false);
    const [allLoaded, setAllLoaded] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers(searchQuery);
    }, [searchQuery, users]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let q = query(collection(db, 'utilisateurs'), limit(20));
            if (lastVisible) {
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

            if (lastVisible) {
                setUsers(users.concat(loadedUsers));
                setFilteredUsers(users.concat(loadedUsers));
            } else {
                setUsers(loadedUsers);
                setFilteredUsers(loadedUsers);
            }
        } catch (error) {
            console.error("Error fetching users: ", error);
        } finally {
            setLoading(false);
            setIsMoreLoading(false);
        }
    };

    const loadMoreUsers = () => {
        if (!allLoaded && !isMoreLoading) {
            setIsMoreLoading(true);
            fetchUsers();
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

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchBar}
                placeholder="Recherche par nom ou prénom..."
                value={searchQuery}
                onChangeText={filterUsers}
            />
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text>Chargement des utilisateurs...</Text>
                </View>
            ) : filteredUsers.length > 0 ? (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.item} onPress={() => handleSelectUser(item.id)}>
                            <Text>{item.firstname} {item.lastname}</Text>
                        </TouchableOpacity>
                    )}
                    onEndReached={loadMoreUsers}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={() => isMoreLoading && !allLoaded ? (
                        <ActivityIndicator size="large" color="#0000ff" />
                    ) : null}
                />
            ) : (
                <Text style={styles.emptyMessage}>Aucun utilisateur trouvé</Text>
            )}
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
    emptyMessage: {
        textAlign: 'center',
        marginTop: 20,
    }
});

export default UsersScreen;
