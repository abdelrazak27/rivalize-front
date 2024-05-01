import { useEffect } from "react";
import { Alert, BackHandler, Text, TouchableOpacity, View } from "react-native";
import { useUser } from "../../context/UserContext";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { usePolling } from "../../hooks/usePolling";
import NotificationsButton from "../../components/NotificationsButton";
import RedirectLinkButton from "../../components/RedirectLinkButton";
import { getAuth, signOut } from "firebase/auth";
import FunctionButton from "../../components/FunctionsButton";


function HomeScreen() {
    const navigation = useNavigation();

    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => true
        );

        return () => backHandler.remove();
    }, []);

    const { user } = useUser();
    const auth = getAuth();

    // usePolling(user.uid);

    return (
        <View>
            {user ? (
                <>
                    <FunctionButton title="Déconnexion" onPress={() => {
                        signOut(auth).then(() => {
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
                    {user.teams && user.teams.length > 0 && (
                        user.teams.map((team, index) => (
                            <View key={index}>
                                <TouchableOpacity onPress={() => {
                                    navigation.navigate('TeamScreen', { teamId: team });
                                }}>
                                    <Text>{team}</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </>
            ) : (
                <Text>Chargement...</Text>
            )}
        </View>
    )
}

export default HomeScreen