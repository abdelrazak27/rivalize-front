import React, { useState } from 'react';
import { Text, View, ScrollView, Dimensions } from 'react-native';
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
    const [contentHeight, setContentHeight] = useState(0);
    const screenHeight = Dimensions.get('window').height;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                scrollEnabled={contentHeight > screenHeight}
                onContentSizeChange={(height) => setContentHeight(height)}
            >
                <Title>Bienvenue sur Rivalize,</Title>
                <Subtitle>Pour profiter pleinement de notre application nous avons besoin de quelques informations</Subtitle>

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
            </ScrollView>

            <View style={styles.buttons}>
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
        </SafeAreaView>
    );
};

export default SignUpStepOne;
