import { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import app from '../../firebaseConfig';
import { useUser } from '../../context/UserContext';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { CommonActions, useNavigation } from '@react-navigation/native';

const auth = getAuth(app);

const SignInScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { setUser } = useUser();
    const db = getFirestore(app);
    const navigation = useNavigation();

    const handleSignIn = () => {
        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredentials) => {
                const user = userCredentials.user;
                const userRef = doc(db, "utilisateurs", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = { uid: user.uid, email: user.email, ...userSnap.data() };
                    setUser(userData);
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'HomeScreen' }],
                        })
                    );
                } else {
                    Alert.alert('Erreur de connexion', 'Une erreur est survenue dans la récupération des données.');
                }
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = getErrorMessage(errorCode);
                Alert.alert('Erreur de connexion', errorMessage);
            });
    };

    const handleSignInForce = (type) => {
        if (type === "player") {
            signInWithEmailAndPassword(auth, "player@rivalize.fr", "@Player1")
                .then(async (userCredentials) => {
                    const user = userCredentials.user;
                    const userRef = doc(db, "utilisateurs", user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const userData = { uid: user.uid, email: user.email, ...userSnap.data() };
                        setUser(userData);
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'HomeScreen' }],
                            })
                        );
                    } else {
                        Alert.alert('Erreur de connexion', 'Une erreur est survenue dans la récupération des données.');
                    }
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = getErrorMessage(errorCode);
                    Alert.alert('Erreur de connexion', errorMessage);
                });
        }
        if (type === "coach") {
            signInWithEmailAndPassword(auth, "coach@rivalize.fr", "@Coach11")
                .then(async (userCredentials) => {
                    const user = userCredentials.user;
                    const userRef = doc(db, "utilisateurs", user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const userData = { uid: user.uid, email: user.email, ...userSnap.data() };
                        setUser(userData);
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'HomeScreen' }],
                            })
                        );
                    } else {
                        Alert.alert('Erreur de connexion', 'Une erreur est survenue dans la récupération des données.');
                    }
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = getErrorMessage(errorCode);
                    Alert.alert('Erreur de connexion', errorMessage);
                });
        }
        if (type === "coach2") {
            signInWithEmailAndPassword(auth, "coach2@rivalize.fr", "@Coach22")
                .then(async (userCredentials) => {
                    const user = userCredentials.user;
                    const userRef = doc(db, "utilisateurs", user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const userData = { uid: user.uid, email: user.email, ...userSnap.data() };
                        setUser(userData);
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'HomeScreen' }],
                            })
                        );
                    } else {
                        Alert.alert('Erreur de connexion', 'Une erreur est survenue dans la récupération des données.');
                    }
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = getErrorMessage(errorCode);
                    Alert.alert('Erreur de connexion', errorMessage);
                });
        }
        if (type === "visitor") {
            signInWithEmailAndPassword(auth, "visitor@rivalize.fr", "@Visitor1")
                .then(async (userCredentials) => {
                    const user = userCredentials.user;
                    const userRef = doc(db, "utilisateurs", user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const userData = { uid: user.uid, email: user.email, ...userSnap.data() };
                        setUser(userData);
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'HomeScreen' }],
                            })
                        );
                    } else {
                        Alert.alert('Erreur de connexion', 'Une erreur est survenue dans la récupération des données.');
                    }
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = getErrorMessage(errorCode);
                    Alert.alert('Erreur de connexion', errorMessage);
                });
        }
    };

    const getErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/invalid-email':
                return 'L\'adresse email saisie n\'est pas valide.';
            default:
                return 'Email ou mot de passe incorrect.';
        }
    };

    return (
        <View>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                placeholder="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="Se connecter" onPress={handleSignIn} />

            <Button title="Se connecter en tant que joueur" onPress={() => handleSignInForce("player")} />
            <Button title="Se connecter en tant que coach" onPress={() => handleSignInForce("coach")} />
            <Button title="Se connecter en tant que coachBis" onPress={() => handleSignInForce("coach2")} />
            <Button title="Se connecter en tant que visiteur" onPress={() => handleSignInForce("visitor")} />

        </View>
    );
}

export default SignInScreen;