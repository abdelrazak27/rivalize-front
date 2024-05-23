import { useEffect } from 'react';
import { BackHandler, Button, ScrollView } from 'react-native';
import { Text, View } from "react-native";
import styles from './styles';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryColorText, Subtitle, Title } from '../../components/TextComponents';
import FunctionButton from '../../components/FunctionButton';

function SignUpComplete() {
    const navigation = useNavigation();

    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => true
        );

        return () => backHandler.remove();
    }, []);

    return (

        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <Title>Nous vous remercions,</Title>
                <Subtitle>Votre compte a bien été créé et enregistré</Subtitle>
            </View>

            <View style={styles.contentComplete}>
                <Text style={styles.contentCompleteText}>Bienvenue chez <PrimaryColorText>rivalize.</PrimaryColorText></Text>
                <FunctionButton
                    title="Continuer"
                    onPress={() => {
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'HomeScreen' }],
                            })
                        );
                    }}
                    variant='primary'
                />
            </View>
        </SafeAreaView>
    )
}

export default SignUpComplete;