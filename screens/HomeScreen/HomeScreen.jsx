import { useEffect } from "react";
import { BackHandler, Text, View } from "react-native";
import { useUser } from "../../context/UserContext";

function HomeScreen() {
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
                <Text>Bienvenue, {user.firstname}</Text> 
            ) : (
                <Text>Chargement...</Text>
            )}
        </View>
    )
}

export default HomeScreen