import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const RedirectLinkButton = ({ routeName, title, params, buttonCustomStyle, textCustomStyle }) => {
    const navigation = useNavigation();

    const handlePress = () => {
        navigation.navigate(routeName, params);
    };

    return (
        <TouchableOpacity onPress={handlePress} style={[styles.button, buttonCustomStyle]}>
            <Text style={[styles.text, textCustomStyle]}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 10,
        backgroundColor: '#007BFF',
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
    },
});

export default RedirectLinkButton;
