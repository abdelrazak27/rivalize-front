import React, { useEffect, useState } from "react";
import { Alert, BackHandler, ScrollView, StyleSheet, Text, View } from "react-native";
import { useUser } from "../../context/UserContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import RedirectLinkButton from "../../components/RedirectLinkButton";
import FunctionButton from "../../components/FunctionButton";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { SafeAreaView } from "react-native-safe-area-context";
import globalStyles from "../../styles/globalStyles";
import { PrimaryColorText, Title } from "../../components/TextComponents";
import { fonts } from "../../styles/fonts";
import colors from "../../styles/colors";
import Spacer from "../../components/Spacer";
import ItemList from "../../components/ItemList";
import CustomList from "../../components/CustomList";
import { getTeamName } from "../../utils/teams";

function HomeScreen({ route }) {
    const navigation = useNavigation();
    const { teamRefresh } = route.params || {};
    const { user, setUser } = useUser();
    const [requestedClubName, setRequestedClubName] = useState('');
    const [teamNames, setTeamNames] = useState({});

    useEffect(() => {
        const fetchRequestedClubName = async () => {
            if (user && user.requestedJoinClubId) {
                const requestRef = doc(db, 'requests_join_club', user.requestedJoinClubId);
                const requestDoc = await getDoc(requestRef);
                if (requestDoc.exists()) {
                    const clubId = requestDoc.data().clubId;
                    const clubRef = doc(db, 'equipes', clubId);
                    const clubDoc = await getDoc(clubRef);
                    if (clubDoc.exists()) {
                        setRequestedClubName(clubDoc.data().name);
                    }
                }
            }
        };

        fetchRequestedClubName();
    }, [user.requestedJoinClubId]);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => true
        );

        return () => backHandler.remove();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            fetchTeamList();
            return () => { };
        }, [teamRefresh])
    );

    useEffect(() => {
        const fetchTeamNames = async () => {
            if (user) {
                const teamsToFetch = user.accountType === 'coach' ? user.teams : [user.team];
                const names = {};
                for (const teamId of teamsToFetch) {
                    if (teamId) {
                        const name = await getTeamName(teamId);
                        names[teamId] = name;
                    }
                }
                setTeamNames(names);
            }
        };

        fetchTeamNames();
    }, [user]);

    const handleCancelRequest = async () => {
        if (!user.requestedJoinClubId) {
            Alert.alert("Aucune demande active", "Vous n'avez pas de demande active à annuler.");
            return;
        }

        try {
            const requestRef = doc(db, 'requests_join_club', user.requestedJoinClubId);
            await updateDoc(requestRef, { state: "canceled" });

            const userRef = doc(db, 'utilisateurs', user.uid);
            await updateDoc(userRef, { requestedJoinClubId: null });

            setUser(prevState => ({ ...prevState, requestedJoinClubId: null }));

            Alert.alert("Demande annulée", "Votre demande pour rejoindre le club a été annulée avec succès.");
        } catch (error) {
            console.error("Erreur lors de l'annulation de la demande :", error);
            Alert.alert("Erreur", "Une erreur est survenue lors de l'annulation de la demande.");
        }
    };

    const fetchTeamList = () => {
        return (
            <>
                {user.accountType === 'coach' && (
                    user.teams && user.teams.length > 0 ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mes clubs</Text>
                            <Text style={styles.sectionSubtitle}>Retrouvez toutes les informations de vos clubs dont vous avez besoin.</Text>
                            <CustomList>
                                {user.teams.map((team, index) => (
                                    <View key={index}>
                                        <ItemList text={teamNames[team] || "..."} onPress={() => {
                                            navigation.navigate('TeamScreen', { teamId: team });
                                        }} />
                                    </View>
                                ))}
                            </CustomList>
                            <View style={{ paddingTop: 3 }}>
                                <FunctionButton
                                    title="Créer un nouveau club"
                                    onPress={() => {
                                        navigation.navigate('CreateTeamScreen');
                                    }}
                                />
                            </View>
                            <Spacer />
                        </View>
                    ) : (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mes clubs</Text>
                            <Text style={styles.sectionSubtitle}>Vous n’avez enregistré aucun club. Vous pouvez créer votre premier club en cliquant ci-dessous.</Text>
                            <FunctionButton
                                title="Créer un nouveau club"
                                onPress={() => {
                                    navigation.navigate('CreateTeamScreen');
                                }}
                            />
                            <Spacer />
                        </View>
                    )
                )}

                {user.accountType === 'player' && (
                    user.team ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mon club</Text>
                            <Text style={styles.sectionSubtitle}>Retrouvez toutes les informations de votre club dont vous avez besoin.</Text>
                            <ItemList text={teamNames[user.team] || "..."} onPress={() => {
                                navigation.navigate('TeamScreen', { teamId: user.team });
                            }} />
                            <Spacer />
                        </View>
                    ) : (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mon club</Text>
                            <Text style={styles.sectionSubtitle}>Vous n’êtes enregistré dans aucun club. Parlez-en à votre coach pour y être invité et participer à de nombreux tournois.</Text>
                            <Spacer top={20} />
                        </View >
                    )
                )}
            </>
        )
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            {user ? (
                <>
                    <View style={globalStyles.headerContainer}>
                        <Title>Bonjour <PrimaryColorText>{user.firstname}</PrimaryColorText>,</Title>
                    </View>

                    <ScrollView
                        contentContainerStyle={globalStyles.scrollContainer}
                    >
                        {user.accountType === 'player' && user.requestedJoinClubId && requestedClubName && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Demande en cours</Text>
                                <Text style={styles.sectionSubtitle}>Votre demande concernant le club {requestedClubName} est toujours en attente.</Text>
                                <FunctionButton title="Annuler ma demande" onPress={handleCancelRequest} variant="primaryOutline" />
                                <Spacer />
                            </View>
                        )}
                        {fetchTeamList()}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Tournois</Text>
                            <Text style={styles.sectionSubtitle}>Retrouvez tous les tournois inscrit sur l’application</Text>
                            <RedirectLinkButton
                                routeName="TournamentsScreen"
                                title="Voir les tournois"
                                params={{ user: user }}
                            />
                            <Spacer />
                        </View>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Clubs</Text>
                            <Text style={styles.sectionSubtitle}>Retrouvez tous les clubs et leurs informations</Text>
                            <RedirectLinkButton
                                routeName="TeamsScreen"
                                title="Voir les clubs"
                            />
                            <Spacer />
                        </View>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Utilisateurs</Text>
                            <Text style={styles.sectionSubtitle}>Retrouvez tous les utilisateurs : coachs, joueurs et même les visiteurs</Text>
                            <RedirectLinkButton
                                routeName="UsersScreen"
                                title="Rechercher un utilisateur"
                            />
                        </View>
                    </ScrollView>
                </>
            ) : (
                <Text>Chargement...</Text>
            )}
        </SafeAreaView>
    )
}

export default HomeScreen;

const styles = StyleSheet.create({
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
    }
});