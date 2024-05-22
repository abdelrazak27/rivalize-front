import { Text, View, ScrollView } from 'react-native';
import styles from './styles';
import { useSignUp } from '../../context/SignUpContext';
import { Subtitle, Title } from '../../components/TextComponents';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomTextInput from '../../components/CustomTextInput';
import FunctionButton from '../../components/FunctionButton';
import { useNavigation } from '@react-navigation/native';

const SignUpStepOne = ({ onNext }) => {
    const { userDetails, handleChange, validateFields } = useSignUp();
    const isButtonDisabled = userDetails.email.length === 0 || userDetails.password.length === 0 || userDetails.passwordConfirm.length === 0;
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <Title>Bienvenue sur Rivalize,</Title>
                <Subtitle>Pour profiter pleinement de notre application nous avons besoin de quelques informations</Subtitle>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
            >
                <View style={styles.inputs}>
                    <CustomTextInput
                        label="Email"
                        placeholder="Votre adresse mail"
                        value={userDetails.email}
                        onChangeText={(text) => handleChange('email', text)}
                    />
                    <CustomTextInput
                        label="Mot de passe"
                        placeholder="Votre mot de passe"
                        value={userDetails.password}
                        onChangeText={(text) => handleChange('password', text)}
                        secureTextEntry
                    />
                    <View>
                        <CustomTextInput
                            label="Confirmation du mot de passe"
                            placeholder="Votre mot de passe"
                            value={userDetails.passwordConfirm}
                            onChangeText={(text) => handleChange('passwordConfirm', text)}
                            secureTextEntry
                        />
                        <Text style={styles.indicationsInput}>Votre mot de passe doit contenir au moins une lettre majuscule et minuscule, un chiffre, et un caractère spécial, à savoir : @, $, !, %, *, ?, &.</Text>
                    </View>
                </View>


                <View style={styles.buttons} >
                    <FunctionButton
                        title="Suivant"
                        onPress={async () => {
                            if (await validateFields(['email', 'password', 'passwordConfirm'], 1)) {
                                onNext();
                            }
                        }}
                        variant='primary'
                        disabled={isButtonDisabled}
                    />
                    <FunctionButton
                        title="Annuler l'inscription"
                        onPress={() => {
                            navigation.goBack();
                        }}
                        variant='primaryOutline'
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SignUpStepOne;
