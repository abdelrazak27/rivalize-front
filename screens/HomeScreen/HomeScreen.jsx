import React, { useEffect, useState } from "react";
import { Alert, BackHandler, Text, TouchableOpacity, View } from "react-native";
import { useUser } from "../../context/UserContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import RedirectLinkButton from "../../components/RedirectLinkButton";
import FunctionButton from "../../components/FunctionButton";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";


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
                {user.teams && user.teams.length > 0 ? (
                    user.teams.map((team, index) => (
                        <View key={index}>
                            <TouchableOpacity onPress={() => {
                                navigation.navigate('TeamScreen', { teamId: team });
                            }}>
                                <Text>{team}</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                ) : user.team ? (
                    <View>
                        <TouchableOpacity onPress={() => {
                            navigation.navigate('TeamScreen', { teamId: user.team });
                        }}>
                            <Text>{user.team}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text>Aucune équipe trouvée</Text>
                )}
            </>
        )
    }

    return (
        <View>
            {user ? (
                <>
                    {user.requestedJoinClubId && requestedClubName && (
                        <View>
                            <Text>Votre demande concernant le club {requestedClubName} est en attente.</Text>
                            <FunctionButton title="Annuler ma demande" onPress={handleCancelRequest} />
                        </View>
                    )}
                    <Text>Bienvenue, {user.firstname}</Text>
                    {user.accountType === 'coach' && (
                        <TouchableOpacity
                            onPress={() => {
                                navigation.navigate('CreateTeamScreen');
                            }}
                        >
                            <Text>Créer mon équipe</Text>
                        </TouchableOpacity>
                    )}
                    <View>
                        {fetchTeamList()}
                    </View>
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
                </>
            ) : (
                <Text>Chargement...</Text>
            )}
        </View>
    )
}

export default HomeScreen