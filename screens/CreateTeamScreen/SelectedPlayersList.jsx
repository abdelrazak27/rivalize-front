import { View, StyleSheet } from "react-native";
import { Label } from "../../components/TextComponents";
import CustomList from "../../components/CustomList";
import ItemList from "../../components/ItemList";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SelectedPlayersList = ({ selectedPlayers, onRemovePlayer }) => {
    return (
        <View style={styles.container}>
            <Label>Joueurs sélectionnés</Label>
            {selectedPlayers.length > 0 && (
                <CustomList>
                    {selectedPlayers.map((player, index) => (
                        <ItemList
                            key={index}
                            text={`${player.firstname} ${player.lastname}`}
                            onPress={() => navigation.navigate('ProfileScreen', { userId: player.uid })}
                            RightButtonIconComponent={MaterialCommunityIcons}
                            rightButtonIconName="close-box-outline"
                            rightButtonOnPress={() => onRemovePlayer(player.uid)}
                        />
                    ))}
                </CustomList>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        gap: 10,
    },
    playerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    playerItem: {
        fontSize: 16,
        marginRight: 10,
    },
    removeButton: {
        fontSize: 16,
        color: "red",
    },
});

export default SelectedPlayersList;
