import { Alert, Button, Text, View } from 'react-native'
import { useUser } from '../../context/UserContext';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import app from '../../firebaseConfig';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import CreateTeamForm from './CreateTeamForm';

const auth = getAuth(app);

function CreateTeamScreen() {

    const { user, setUser } = useUser();
    const db = getFirestore(app);

    const signIn = () => {
        signInWithEmailAndPassword(auth, "coach@rivalize.fr", "@Coach11")
            .then(async (userCredentials) => {
                const user = userCredentials.user;
                const userRef = doc(db, "utilisateurs", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = { uid: user.uid, email: user.email, ...userSnap.data() };
                    setUser(userData);
                } else {
                    Alert.alert('Erreur de connexion', 'Une erreur est survenue dans la récupération des données.');
                }
            })
            .catch((error) => {
                // Gestion des erreurs
                const errorCode = error.code;
                const errorMessage = getErrorMessage(errorCode);
                Alert.alert('Erreur de connexion', errorMessage);
            });
    }

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
            {user ? (
                <View>
                    <Text>Créez votre équipe</Text>
                    <CreateTeamForm />
                </View>
            ) : (
                <View>
                    <Text>Not connected yet</Text>
                    <Button title='Se connecter' onPress={signIn} />
                </View>
            )}
        </View>
    )
}

export default CreateTeamScreen;