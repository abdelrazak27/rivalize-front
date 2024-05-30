import { BackHandler, Text, Alert, StyleSheet, View, Button, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import app, { db } from '../../firebaseConfig';
import { useUser } from '../../context/UserContext';
import { doc, getDoc } from 'firebase/firestore';
import { CommonActions, useNavigation } from '@react-navigation/native';
import FunctionButton from '../../components/FunctionButton';
import RedirectLinkButton from '../../components/RedirectLinkButton';
import CustomTextInput from '../../components/CustomTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Subtitle, Title } from '../../components/TextComponents';
import colors from '../../styles/colors';
import { fonts } from '../../styles/fonts';
import { useLoading } from '../../context/LoadingContext';

const auth = getAuth(app);

function ConnexionScreen() {
    const { setIsLoading } = useLoading();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { user, setUser } = useUser();
    const navigation = useNavigation();

    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => true
        );

        return () => backHandler.remove();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (userFound) => {
            if (userFound && !user) {
                setIsLoading(true);
                const userRef = doc(db, "utilisateurs", userFound.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = { uid: userFound.uid, email: userFound.email, ...userSnap.data() };
                    setUser(userData);
                    setIsLoading(false);
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'HomeScreen', params: { noAnimation: true } }],
                        })
                    );
                } else {
                    setIsLoading(false);
                    Alert.alert('Erreur', 'Une erreur est survenue dans la récupération des données.');
                }
            }
        });
        return unsubscribe;
    }, []);

    const handleSignIn = () => {
        setIsLoading(true);
        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredentials) => {
                const user = userCredentials.user;
                const userRef = doc(db, "utilisateurs", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = { uid: user.uid, email: user.email, ...userSnap.data() };
                    setUser(userData);
                    setIsLoading(false);
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'HomeScreen', params: { noAnimation: true } }],
                        })
                    );
                } else {
                    setIsLoading(false);
                    Alert.alert('Erreur de connexion', 'Une erreur est survenue dans la récupération des données.');
                }
            })
            .catch((error) => {
                setIsLoading(false);
                const errorCode = error.code;
                const errorMessage = getErrorMessage(errorCode);
                Alert.alert('Erreur de connexion', errorMessage);
            });
    };

    const handleSignInForce = (type) => {
        setIsLoading(true);
        let email = "";
        let password = "";
        if (type === "player") {
            email = "player@rivalize.fr";
            password = "@Player1";
        } else if (type === "player2") {
            email = "player2@rivalize.fr";
            password = "@Player2";
        } else if (type === "coach") {
            email = "coach@rivalize.fr";
            password = "@Coach11";
        } else if (type === "coach2") {
            email = "coach2@rivalize.fr";
            password = "@Coach22";
        } else if (type === "visitor") {
            email = "visitor@rivalize.fr";
            password = "@Visitor1";
        }

        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredentials) => {
                const user = userCredentials.user;
                const userRef = doc(db, "utilisateurs", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = { uid: user.uid, email: user.email, ...userSnap.data() };
                    setUser(userData);
                    setIsLoading(false);
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'HomeScreen', params: { noAnimation: true } }],
                        })
                    );
                } else {
                    setIsLoading(false);
                    Alert.alert('Erreur de connexion', 'Une erreur est survenue dans la récupération des données.');
                }
            })
            .catch((error) => {
                setIsLoading(false);
                const errorCode = error.code;
                const errorMessage = getErrorMessage(errorCode);
                Alert.alert('Erreur de connexion', errorMessage);
            });
    };

    const getErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/invalid-credential':
                return 'Le mot de passe ou l\'email est incorrect.';
            case 'auth/user-disabled':
                return 'Ce compte a été désactivé.';
            case 'auth/user-not-found':
                return 'Aucun utilisateur trouvé avec cet email.';
            case 'auth/network-request-failed':
                return 'La connexion a échoué. Veuillez vérifier votre connexion Internet.';
            case 'auth/too-many-requests':
                return 'Trop de tentatives de connexion. Veuillez réessayer plus tard.';
            case 'auth/operation-not-allowed':
                return 'Cette opération n\'est pas autorisée. Veuillez contacter le support.';
            default:
                return 'Une erreur est survenue. Veuillez réessayer.';
        }
    };

    const isButtonDisabled = email.length === 0 || password.length === 0;

    return (
        <SafeAreaView style={styles.container}>
            <Title>Bienvenue,</Title>
            <Subtitle>Connectez-vous pour continuer l'aventure</Subtitle>

            <ScrollView>
                <View style={styles.inputs}>
                    <CustomTextInput
                        label="Email"
                        placeholder="Votre adresse mail"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <CustomTextInput
                        label="Mot de passe"
                        placeholder="Votre mot de passe"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <View style={{ paddingBottom: 20 }}>
                    <FunctionButton title="Se connecter" onPress={handleSignIn} variant='primary' disabled={isButtonDisabled} />
                    <Text style={styles.orText}>ou</Text>
                    <RedirectLinkButton routeName="SignUpScreen" title="S'inscrire" variant='primaryOutline' />
                </View>

                <Button title="Se connecter en tant que joueur" onPress={() => handleSignInForce("player")} />
                <Button title="Se connecter en tant que joueurBis" onPress={() => handleSignInForce("player2")} />
                <Button title="Se connecter en tant que coach" onPress={() => handleSignInForce("coach")} />
                <Button title="Se connecter en tant que coachBis" onPress={() => handleSignInForce("coach2")} />
                <Button title="Se connecter en tant que visiteur" onPress={() => handleSignInForce("visitor")} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default ConnexionScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 30,
    },
    orText: {
        fontSize: 15,
        fontFamily: fonts.OutfitBold,
        color: colors.secondary,
        textAlign: 'center',
        paddingVertical: 20
    },
    inputs: {
        paddingTop: 100,
        gap: 20,
        marginBottom: 35
    }
});
