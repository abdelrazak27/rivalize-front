import { StyleSheet } from 'react-native';
import { fonts } from '../../styles/fonts';
import colors from '../../styles/colors';

export default StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        marginHorizontal: 30,
        paddingBottom: 50,
    },
    scrollContainer: {
        flexGrow: 1,
        marginHorizontal: 30,
    },
    inputs: {
        gap: 20,
        marginBottom: 35,
    },
    rowWithButton: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    indicationsInput: {
        fontSize: 14,
        fontFamily: fonts.OutfitSemiBold,
        color: colors.secondary,
        paddingTop: 5,
    },
    buttons: {
        marginHorizontal: 30,
        paddingVertical: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: colors.lightgrey,
        gap: 20,
    },
    citiesList: {
        backgroundColor: 'white',
        gap: 5,
        marginTop: 5,
        width: '100%',
    },
    city: {
        padding: 11,
        borderWidth: 2,
        borderRadius: 8,
        borderColor: colors.secondary,
    },
    contentComplete: {
        flex: 1,
        justifyContent: 'center',
        marginHorizontal: 30,
        gap: 17,
        paddingBottom: 120, 
    },
    contentCompleteText: {
        fontSize: 15,
        fontFamily: fonts.OutfitBold,
        textAlign: 'center',
    }
});