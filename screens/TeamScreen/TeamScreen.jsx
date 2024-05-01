import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Text, View, ActivityIndicator, Image, StyleSheet } from "react-native";
import { db } from "../../firebaseConfig";
import { useUser } from "../../context/UserContext";
import FunctionButton from "../../components/FunctionsButton";

function TeamScreen() {
    const route = useRoute();
    const { teamId } = route.params;
    const { user } = useUser();
    const navigation = useNavigation();

    const [teamData, setTeamData] = useState(null);
    const [coachData, setCoachData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTeamDetails = async () => {
        const teamRef = doc(db, 'equipes', teamId);
        const teamDoc = await getDoc(teamRef);
        if (teamDoc.exists()) {
            setTeamData(teamDoc.data());
            await getCoachInfo(teamDoc.data().coach_id);
        } else {
            setIsLoading(false);
        }
    };

    const getCoachInfo = async (coachId) => {
        if (coachId) {
            const coachRef = doc(db, 'utilisateurs', coachId);
            const coachDoc = await getDoc(coachRef);
            if (coachDoc.exists()) {
                setCoachData(coachDoc.data());
            }
        }
        setIsLoading(false);
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchTeamDetails();
            return () => {};
        }, [teamId])
    );

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text>
                Team ID: {teamId}
            </Text>
            {teamData ? (
                <>
                    <Text>Nom : {teamData.name}</Text>
                    <Text>Catégorie : {teamData.category}</Text>
                    <Text>Ville : {teamData.city}</Text>
                    <Text>Coach : {coachData ? `${coachData.firstname} ${coachData.lastname}` : "Inconnu"}</Text>
                    <Text>Color int : {teamData.color_int}</Text>
                    <Text>Color ext : {teamData.color_ext}</Text>
                    <Text>Nombre de joueur(s) : {teamData.players.length > 0 ? teamData.players.length : "0"}</Text>
                    {teamData.logo_link && (
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: teamData.logo_link }}
                                style={styles.logo}
                            />
                        </View>
                    )}
                    {user.uid === teamData.coach_id && (
                        <FunctionButton
                            title="Modifier les informations de l'équipe"
                            onPress={() => navigation.navigate('EditTeamScreen', { teamData: teamData })}
                        />
                    )}
                </>
            ) : (
                <Text>Aucune donnée de l'équipe disponible</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    imageContainer: {
        alignItems: 'center',
        marginVertical: 20
    },
    logo: {
        width: 200,
        height: 200,
        resizeMode: 'contain'
    }
});

export default TeamScreen;
