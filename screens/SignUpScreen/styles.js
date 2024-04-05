import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    birthdayBlock: {
        display: 'flex',
        gap: 15,
        marginBottom: 15,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cities: {
        position: 'relative',
    },
    citiesList: {
        borderColor: 'gray',
        backgroundColor: 'white',
        borderWidth: 1,
        position: 'absolute',
        top: 40,
        width: '100%',
    },
});
