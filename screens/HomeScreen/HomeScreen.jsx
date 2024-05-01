import { useEffect } from "react";
import { BackHandler, Text, TouchableOpacity, View } from "react-native";
import { useUser } from "../../context/UserContext";
import { useNavigation } from "@react-navigation/native";
import { usePolling } from "../../hooks/usePolling";
import NotificationsButton from "../../components/NotificationsButton";


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
    // usePolling(user.uid);

    return (
        <View>
            {user ? (
                <>
                    <NotificationsButton userId={user.uid} />
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