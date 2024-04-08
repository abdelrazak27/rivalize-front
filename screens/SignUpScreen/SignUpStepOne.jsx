import { View, TextInput, Button, Text } from 'react-native';
import styles from './styles';
import { useSignUp } from '../../context/SignUpContext';


const SignUpStepOne = ({ onNext }) => {
    const { userDetails, handleChange, validateFields } = useSignUp();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>STEP 1: Information de connexion</Text>
            <TextInput
                style={styles.input}
                placeholder="Email *"
                value={userDetails.email}
                onChangeText={(text) => handleChange('email', text)}
            />
            <Text>Le mot de passe doit contenir :</Text>
            
            <Text>- Longueur minimale de 8 caractères</Text>
            <Text>- Au moins une lettre minuscule</Text>
            <Text>- Au moins une lettre majuscule</Text>
            <Text>- Au moins un chiffre</Text>
            <Text>- Au moins un caractère spécial : @ $ ! % * ? &</Text>

            <TextInput
                style={styles.input}
                placeholder="Mot de passe *"
                value={userDetails.password}
                onChangeText={(text) => handleChange('password', text)}
                secureTextEntry
            />
            <TextInput
                style={styles.input}
                placeholder="Confirmer votre mot de passe *"
                value={userDetails.passwordConfirm}
                onChangeText={(text) => handleChange('passwordConfirm', text)}
                secureTextEntry
            />
            <Button title="Suivant" onPress={() => {
                if (validateFields(['email', 'password', 'passwordConfirm'], 1)) {
                    onNext();
                }
            }} />
        </View>
    );
};

export default SignUpStepOne;
