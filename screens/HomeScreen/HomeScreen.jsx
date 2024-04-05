import { useEffect } from "react";
import { BackHandler, Text, View } from "react-native";

function HomeScreen() {
    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => true
        );

        return () => backHandler.remove();
    }, []);

    return (
        <View>
            <Text>HomeScreen</Text>
        </View>
    )
}

export default HomeScreen