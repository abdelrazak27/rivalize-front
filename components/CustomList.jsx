import { StyleSheet, View } from 'react-native';

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
