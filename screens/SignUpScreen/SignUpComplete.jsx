import { useEffect } from 'react';
import { BackHandler, Button } from 'react-native';
import { Text, View } from "react-native";
import styles from './styles';
import { CommonActions, useNavigation } from '@react-navigation/native';

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
        <View style={styles.container}>
            <Text style={styles.title}>STEP COMPLETED: Inscription réussie</Text>
            <Button title='Continuer' onPress={() => {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'HomeScreen' }],
                    })
                );
            }} />
        </View>
    )
}

export default SignUpComplete;