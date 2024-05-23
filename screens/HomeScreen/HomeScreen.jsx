import React, { useEffect, useState } from "react";
import { Alert, BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useUser } from "../../context/UserContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import RedirectLinkButton from "../../components/RedirectLinkButton";
import FunctionButton from "../../components/FunctionButton";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { SafeAreaView } from "react-native-safe-area-context";
import globalStyles from "../../styles/globalStyles";
import { PrimaryColorText, Subtitle, Title } from "../../components/TextComponents";
import { fonts } from "../../styles/fonts";
import colors from "../../styles/colors";
import Spacer from "../../components/Spacer";

function HomeScreen({ route }) {
    const navigation = useNavigation();
    const { teamRefresh } = route.params || {};
    const { user, setUser } = useUser();
    const [requestedClubName, setRequestedClubName] = useState('');

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

            Alert.alert("Demande annulée", "Votre demande pour rejoindre l'équipe a été annulée avec succès.");
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
                            <Text style={styles.sectionTitle}>Mes équipes</Text>
                            <Text style={styles.sectionSubtitle}>Retrouvez toutes les informations de vos équipes dont vous avez besoin.</Text>
                            <FunctionButton
                                title="Créer une nouvelle équipe"
                                onPress={() => {
                                    navigation.navigate('CreateTeamScreen');
                                }}
                            />
                            {user.teams.map((team, index) => (
                                <View key={index}>
                                    <TouchableOpacity onPress={() => {
                                        navigation.navigate('TeamScreen', { teamId: team });
                                    }}>
                                        <Text>{team}</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <Spacer />
                        </View>
                    ) : (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mes équipes</Text>
                            <Text style={styles.sectionSubtitle}>Vous n’avez enregistré aucune équipe. Vous pouvez créer votre première équipe en cliquant ci-dessous.</Text>
                            <FunctionButton
                                title="Créer une nouvelle équipe"
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
                            <Text style={styles.sectionTitle}>Mon équipe</Text>
                            <Text style={styles.sectionSubtitle}>Retrouvez toutes les informations de votre équipe dont vous avez besoin.</Text>
                            <TouchableOpacity onPress={() => {
                                        navigation.navigate('TeamScreen', { teamId: user.team });
                                    }}>
                                        <Text>{user.team}</Text>
                                    </TouchableOpacity>
                            <Spacer />
                        </View>
                    ) : (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mon équipe</Text>
                            <Text style={styles.sectionSubtitle}>Vous n’êtes enregistré dans aucune équipe. Parlez-en à votre coach pour y être invité et participer à de nombreux tournois.</Text>
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
                        <RedirectLinkButton
                            routeName="TournamentsScreen"
                            title="Tournois"
                            params={{ user: user }}
                            buttonStyle={{ backgroundColor: 'green' }}
                            textStyle={{ fontSize: 18 }}
                        />
                        <RedirectLinkButton
                            routeName="TeamsScreen"
                            title="Équipes"
                            buttonStyle={{ backgroundColor: 'green' }}
                            textStyle={{ fontSize: 18 }}
                        />
                        <RedirectLinkButton
                            routeName="UsersScreen"
                            title="Utilisateurs"
                            buttonStyle={{ backgroundColor: 'green' }}
                            textStyle={{ fontSize: 18 }}
                        />
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