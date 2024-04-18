import { useEffect } from "react";
import { BackHandler, Text, TouchableOpacity, View } from "react-native";
import { useUser } from "../../context/UserContext";
import { useNavigation } from "@react-navigation/native";

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

    return (
        <View>
            {user ? (
                <>
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
                    
                </>
            ) : (
                <Text>Chargement...</Text>
            )}
        </View>
    )
}

export default HomeScreen