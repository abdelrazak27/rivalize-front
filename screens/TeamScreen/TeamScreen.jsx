import { useRoute } from "@react-navigation/native";
import { Text, View } from "react-native";

function TeamScreen() {
    const route = useRoute();
    const { teamId } = route.params;

    return (
        <View>
            <Text>
                teamID : {teamId}
            </Text>
        </View>
    )
}

export default TeamScreen