import colors from '../styles/colors';
import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '../styles/fonts';

const CustomList = ({ children }) => {
    return (
        <View style={styles.container}>{children}</View>
    );
};

export default CustomList;

const styles = StyleSheet.create({
    container: {
        gap: 8
    }
});
