import { View, Text, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import styles from './styles';
import { useSignUp } from '../../context/SignUpContext';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Label, Subtitle, Title } from '../../components/TextComponents';
import CustomTextInput from '../../components/CustomTextInput';
import FunctionButton from '../../components/FunctionButton';


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

    const isButtonDisabled =
    !userDetails.accountType ||
    (userDetails.accountType === 'coach' && !userDetails.licenceNumber) ||
    (userDetails.accountType === 'player' && (!userDetails.licenceNumber || !userDetails.playerName || !userDetails.playerNumber)) ||
    ((userDetails.accountType === 'player' || userDetails.accountType === 'coach') && licenceValidationMessage !== 'Licence enregistrée à la FFF.');

    const navigation = useNavigation();

    return (
        <>
            <SafeAreaView style={styles.container}>
                <View style={styles.headerContainer}>
                    <Title>Bienvenue sur Rivalize,</Title>
                    <Subtitle>Pour profiter pleinement de notre application nous avons besoin de quelques informations</Subtitle>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                >
                    <View style={styles.inputs}>
                        <Label>Type du compte</Label>
                        <Picker
                            selectedValue={userDetails.accountType}
                            onValueChange={(itemValue) => (
                                handleChange('accountType', itemValue),
                                setLicenceValidationMessage('')
                            )}
                        >
                            <Picker.Item label="Choisir le type de compte" value="" />
                            <Picker.Item label="Joueur" value="player" />
                            <Picker.Item label="Entraîneur" value="coach" />
                            <Picker.Item label="Visiteur" value="visitor" />
                        </Picker>
                        {(userDetails.accountType === "player" || userDetails.accountType === "coach") && (
                            <View>
                                <View style={styles.rowWithButton}>
                                    <View style={{ flex: 0.7 }}>
                                        <CustomTextInput
                                            label="Numéro de licence *"
                                            placeholder="Votre licence"
                                            value={userDetails.licenceNumber}
                                            onChangeText={(text) => {
                                                handleChange('licenceNumber', text)
                                                setLicenceValidationMessage('')
                                            }}
                                        />
                                    </View>
                                    <View style={{ flex: 0.3 }}>
                                        <FunctionButton 
                                            title='vérifier'
                                            onPress={checkLicence}
                                            variant='secondaryOutline'
                                            disabled={!userDetails.licenceNumber}
                                        />
                                    </View>
                                </View>
                                {licenceValidationMessage && <Text style={styles.indicationsInput}>{licenceValidationMessage}</Text>}
                            </View>
                        )}
                        {userDetails.accountType === "player" && (
                            <>
                                <CustomTextInput
                                    label="Nom de joueur *"
                                    placeholder="Votre nom de joueur"
                                    value={userDetails.playerName}
                                    onChangeText={(text) => handleChange('playerName', text)}
                                />
                                <CustomTextInput
                                    label="Numéro de joueur *"
                                    value={userDetails.playerNumber}
                                    onChangeText={(text) => handleChange('playerNumber', text)}
                                    keyboardType="numeric"
                                />
                            </>
                        )}
                    </View>
                </ScrollView>

                <View style={styles.buttons}>
                    <FunctionButton
                        title="Suivant"
                        onPress={() => {
                            if (!userDetails.accountType) {
                                Alert.alert('Erreur', 'Veuillez choisir un type de compte.');
                                return;
                            }

                            if (!userDetails.accountType || (userDetails.accountType === ('player' || 'coach') && licenceValidationMessage.includes('non enregistrée'))) {
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

                            if (fieldsToValidate.includes('playerNumber') && !regexTwoDigits.test(userDetails.playerNumber)) {
                                Alert.alert('Erreur', 'Veuillez saisir un numéro du joueur à deux chiffres.');
                                return;
                            }

                            if (fieldsToValidate.includes('playerName') && !nameRegex.test(userDetails.playerName)) {
                                Alert.alert('Erreur', 'Veuillez saisir un nom du joueur valide.');
                                return;
                            }

                            if (validateFields(fieldsToValidate)) {
                                handleSignUp(onSignUpSuccess);
                            }
                        }}
                        variant='primary'
                        disabled={isButtonDisabled}
                    />
                    <FunctionButton
                        title="Précédent"
                        onPress={onPrevious}
                        variant='primaryOutline'
                    />
                </View>
            </SafeAreaView>
        </>
    );
};

export default SignUpStepThree;
