import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { app, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import citiesData from '../screens/SignUpScreen/data/sortedFrance.json'

const SignUpContext = createContext();
const auth = getAuth(app);

export const useSignUp = () => useContext(SignUpContext);

export const SignUpProvider = ({ children }) => {
    const [licenceValidationMessage, setLicenceValidationMessage] = useState('');

    const [userDetails, setUserDetails] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        firstname: '',
        lastname: '',
        birthday: new Date().toISOString().split('T')[0],
        city: '',
        accountType: '',
        licenceNumber: '',
        playerName: '',
        playerNumber: '',
    });

    const calculateAge = (birthday) => {
        const birthdayDate = new Date(birthday);
        const ageDifMs = Date.now() - birthdayDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const formatDateToDDMMYYYY = (date) => {
        const d = new Date(date);
        const day = ('0' + d.getDate()).slice(-2);
        const month = ('0' + (d.getMonth() + 1)).slice(-2);
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleChange = (name, value) => {
        setUserDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const validateFields = (fieldsToValidate, step) => {

        const requiredFields = fieldsToValidate.concat(
            userDetails.accountType === "player" && step === 3 ? ['playerName', 'playerNumber', 'licenceNumber'] : [],
            userDetails.accountType === "coach" && step === 3 ? ['licenceNumber'] : []
        );

        const missingField = requiredFields.find(field => !userDetails[field]);
        if (missingField) {
            Alert.alert('Erreur', `Veuillez remplir tous les champs obligatoires (marqués d'une étoile).`);
            return false;
        }

        if (step === 1) {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regex.test(userDetails.email)) {
                Alert.alert('Erreur', 'Veuillez saisir une adresse mail valide.');
                return false;
            }

            if (fieldsToValidate.includes('password') && userDetails.password !== userDetails.passwordConfirm) {
                Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
                return false;
            }
        }
        if (step === 2) {
            if (userDetails.birthday && calculateAge(userDetails.birthday) < 5) {
                Alert.alert("Erreur", "L'âge minimum pour être inscrit est de 5 ans.");
                return false;
            }
            if (userDetails.city.trim() && !citiesData.some((city) => city.Nom_commune.toLowerCase() === userDetails.city.toLowerCase().trim())) {
                Alert.alert("Erreur", "Veuillez sélectionner une ville valide de la liste.");
                return false;
            }
        }

        return true;
    };

    const handleSignUp = () => {
        createUserWithEmailAndPassword(auth, userDetails.email, userDetails.password)
            .then(userCredentials => {
                const user = userCredentials.user;

                const userData = {
                    ...userDetails,
                    birthday: userDetails.birthday || new Date().toISOString().split('T')[0],
                };
                delete userData.password;
                delete userData.passwordConfirm;

                const userRef = doc(db, 'utilisateurs', user.uid);
                setDoc(userRef, userData)
                    .then(() => {
                        console.log('Utilisateur ajouté à Firestore avec succès');
                    })
                    .catch((error) => {
                        console.error('Erreur lors de l\'ajout de l\'utilisateur à Firestore: ', error);
                    });

            })
            .catch((error) => {
                const errorMessage = getErrorMessage(error.code);
                Alert.alert('Erreur d\'inscription', errorMessage);
            });

    };

    const getErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/email-already-in-use': return 'Cette adresse email est déjà utilisée par un autre compte.';
            case 'auth/weak-password': return 'Le mot de passe doit contenir au moins 6 caractères.';
            case 'auth/invalid-email': return 'L\'adresse email saisie n\'est pas valide.';
            default: return `Une erreur inattendue est survenue (${errorCode}). Veuillez réessayer plus tard.`;
        }
    };

    return (
        <SignUpContext.Provider value={{ userDetails, handleChange, validateFields, handleSignUp, calculateAge, formatDateToDDMMYYYY, licenceValidationMessage, setLicenceValidationMessage }}>
            {children}
        </SignUpContext.Provider>
    );
};
