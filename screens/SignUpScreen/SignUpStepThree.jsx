import { View, TextInput, Button, Text, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import styles from './styles';
import { useSignUp } from '../../context/SignUpContext';
import { useNavigation } from '@react-navigation/native';


const SignUpStepThree = ({ onPrevious, onSignUpSuccess }) => {
    const { userDetails, handleChange, validateFields, handleSignUp, setLicenceValidationMessage, licenceValidationMessage } = useSignUp();

    const checkLicence = () => {
        const regexAlphanumeric = /^[a-zA-Z0-9]+$/;
        if ((userDetails.accountType === 'coach' && userDetails.licenceNumber.startsWith('FFFC') && userDetails.licenceNumber.length > 4) && regexAlphanumeric.test(userDetails.licenceNumber) ||
            (userDetails.accountType === 'player' && userDetails.licenceNumber.startsWith('FFFP') && userDetails.licenceNumber.length > 4) && regexAlphanumeric.test(userDetails.licenceNumber)) {
            setLicenceValidationMessage('Licence enregistrée à la FFF.');
        } else {
            setLicenceValidationMessage('Licence non enregistrée à la FFF.');
        }
    };

    const navigation = useNavigation();    

    return (
        <View style={styles.container}>
            <Text style={styles.title}>STEP 3: Informations professionnelles</Text>
            <Picker
                selectedValue={userDetails.accountType}
                onValueChange={(itemValue) => handleChange('accountType', itemValue)}>
                <Picker.Item label="Choisir le type de compte" value="" />
                <Picker.Item label="Joueur" value="player" />
                <Picker.Item label="Entraîneur" value="coach" />
                <Picker.Item label="Visiteur" value="visitor" />
            </Picker>
            {(userDetails.accountType === "player" || userDetails.accountType === "coach") && (
                <>
                    <TextInput
                        placeholder="Numéro de licence *"
                        value={userDetails.licenceNumber}
                        onChangeText={(text) => {
                            handleChange('licenceNumber', text)
                            setLicenceValidationMessage('')
                        }}
                    />
                    <Button title='check' onPress={checkLicence} />
                    {licenceValidationMessage && <Text>{licenceValidationMessage}</Text>}
                </>
            )}
            {userDetails.accountType === "player" && (
                <>
                    <TextInput
                        placeholder="Nom de joueur *"
                        value={userDetails.playerName}
                        onChangeText={(text) => handleChange('playerName', text)}
                    />
                    <TextInput
                        placeholder="Numéro de joueur *"
                        value={userDetails.playerNumber}
                        onChangeText={(text) => handleChange('playerNumber', text)}
                        keyboardType="numeric"
                    />
                </>
            )}
            <Button title="Précédent" onPress={onPrevious} />
            <Button title="S'inscrire" onPress={() => {
                if (!userDetails.accountType) {
                    Alert.alert('Erreur', 'Veuillez choisir un type de compte.');
                    return;
                }

                if (!userDetails.accountType || licenceValidationMessage.includes('non enregistrée')) {
                    Alert.alert('Erreur', 'Veuillez saisir un numéro de licence valide.');
                    return;
                }

                if (!licenceValidationMessage && userDetails.accountType === ('player' || 'coach')) {
                    Alert.alert('Erreur', 'Veuillez vérifier votre numéro de licence.');
                    return;
                }

                let fieldsToValidate = ['accountType'];

                if (userDetails.accountType === 'player') {
                    fieldsToValidate.push('playerName', 'playerNumber', 'licenceNumber');
                } else if (userDetails.accountType === 'coach') {
                    fieldsToValidate.push('licenceNumber');
                }

                const regexTwoDigits = /^\d{1,2}$/;
                const nameRegex = /^[a-zA-ZàâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ' -]+$/;

                if(fieldsToValidate.includes('playerNumber') && !regexTwoDigits.test(userDetails.playerNumber)) {
                    Alert.alert('Erreur', 'Votre numéro du joueur doit contenir deux chiffres.');
                    return;
                }
                
                if(fieldsToValidate.includes('playerName') && !nameRegex.test(userDetails.playerName)) {
                    Alert.alert('Erreur', 'Votre nom du joueur est invalide.');
                    return;
                }

                if (validateFields(fieldsToValidate)) {
                    handleSignUp(onSignUpSuccess);
                }
            }} />
        </View>
    );
};

export default SignUpStepThree;
