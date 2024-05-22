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
    }
});
// export default StyleSheet.create({
//     container: {
//         flex: 1,
//         paddingTop: 0,
//         paddingHorizontal: 30,
//         backgroundColor: "red"
//     },
//     inputs: {
//         paddingTop: 100,
//         display: 'flex',
//         gap: 20,
//         marginBottom: 35
//     },
//     title: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         marginBottom: 20,
//         color: '#333',
//     },
//     input: {
//         borderWidth: 1,
//         borderColor: '#ccc',
//         borderRadius: 5,
//         padding: 10,
//         marginBottom: 15,
//         fontSize: 16,
//     },
//     birthdayBlock: {
//         display: 'flex',
//         gap: 15,
//         marginBottom: 15,
//         flexDirection: 'column',
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     cities: {
//         position: 'relative',
//     },
//     citiesList: {
//         borderColor: 'gray',
//         backgroundColor: 'white',
//         borderWidth: 1,
//         position: 'absolute',
//         top: 40,
//         width: '100%',
//     },
// });
