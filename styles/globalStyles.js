import { StyleSheet } from 'react-native';
import colors from './colors';

export default StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        marginHorizontal: 30,
        paddingBottom: 50,
        borderBottomColor: colors.lightgrey,
        borderBottomWidth: 1,
    },
    headerContainerWithNoBorderBottom: {
        marginHorizontal: 30,
        paddingBottom: 50,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingTop: 10,
        paddingBottom: 30,
        marginHorizontal: 30,
    },
    modal: {
        flex: 1,
        backgroundColor: 'white',
        paddingTop: 180,
    }
});