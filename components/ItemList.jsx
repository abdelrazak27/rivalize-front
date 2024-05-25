import colors from '../styles/colors';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { fonts } from '../styles/fonts';

const ItemList = ({ text, onPress, RightButtonIconComponent, rightButtonIconName, rightButtonOnPress }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <Text style={styles.text}>{text}</Text>
            {(RightButtonIconComponent || rightButtonOnPress || rightButtonIconName) && (
                <TouchableOpacity onPress={rightButtonOnPress} style={styles.rightButton}>
                    <RightButtonIconComponent name={rightButtonIconName} size={26} color={colors.error} />
                </TouchableOpacity>
            )}
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
        position: 'relative'
    },
    text: {
        textAlign: 'center',
        color: colors.darkgrey,
        fontSize: 15,
        fontFamily: fonts.OutfitSemiBold
    },
    rightButton: {
        position: 'absolute',
        right: 8,
    }
});
