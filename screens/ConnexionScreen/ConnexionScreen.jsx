import { BackHandler, Text, View } from 'react-native'
import SignInScreen from '../SignInScreen/SignInScreen'
import { Link } from '@react-navigation/native'
import { useEffect } from 'react';

function ConnexionScreen() {
    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => true
        );

        return () => backHandler.remove();
    }, []);

    return (
        <View>
            <Text>ConnexionScreen</Text>
            <SignInScreen />
            <Text>Toujours pas de compte ? <Link to={{ screen: 'SignUpScreen' }}>s'inscrire</Link></Text>
        </View>
    )
}

export default ConnexionScreen
