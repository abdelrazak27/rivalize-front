import React, { useEffect } from "react";
import { Alert, BackHandler, Text, TouchableOpacity, View } from "react-native";
import { useUser } from "../../context/UserContext";
import { CommonActions, useFocusEffect, useNavigation } from "@react-navigation/native";
import NotificationsButton from "../../components/NotificationsButton";
import RedirectLinkButton from "../../components/RedirectLinkButton";
import { getAuth, signOut } from "firebase/auth";
import FunctionButton from "../../components/FunctionsButton";


function HomeScreen({ route }) {
    const navigation = useNavigation();
    const { teamRefresh } = route.params || {};
    const { user, setUser } = useUser();
    const auth = getAuth();

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
                    <FunctionButton title="Déconnexion" onPress={() => {
                        signOut(auth).then(() => {
                            setUser({});
                            Alert.alert("Déconnexion", "vous avez été déconnecté avec succès.")
                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'ConnexionScreen' }],
                                })
                            );
                        }).catch((error) => {
                            console.log(error);
                        });
                    }} />
                    <NotificationsButton userId={user.uid} />
                    <RedirectLinkButton
                        routeName="ProfileScreen"
                        title="Profile"
                        params={{ userId: user.uid }}
                        buttonStyle={{ backgroundColor: 'green' }}
                        textStyle={{ fontSize: 18 }}
                    />
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
                </>
            ) : (
                <Text>Chargement...</Text>
            )}
        </View>
    )
}

export default HomeScreen