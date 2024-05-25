import colors from '../styles/colors';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { fonts } from '../styles/fonts';

const ItemList = ({ text, onPress, rightButtonAction, rightButtonIcon }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <Text style={styles.text}>{text}</Text>
        </TouchableOpacity>
    );
};

export default ItemList;

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.verylightgrey,
        borderRadius: 8,
        minHeight: 15,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        textAlign: 'center',
        color: colors.darkgrey,
        fontSize: 15,
        fontFamily: fonts.OutfitSemiBold
    }
});
