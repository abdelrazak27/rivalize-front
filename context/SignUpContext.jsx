import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { app, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import citiesData from '../screens/SignUpScreen/data/citiesFR.json'

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

    // const handleChange = (name, value) => {
    //     setUserDetails((prevDetails) => ({
    //         ...prevDetails,
    //         [name]: value,
    //     }));
    // };

    const handleChange = (name, value) => {
        setUserDetails((prevDetails) => {
            let updatedDetails = { ...prevDetails, [name]: value };
    
            if (name === 'accountType') {
                // Logique pour ajuster les valeurs en fonction du type de compte
                if (value === 'coach') {
                    // Pour un coach, on réinitialise les champs spécifiques aux joueurs
                    updatedDetails.playerName = '';
                    updatedDetails.playerNumber = '';
                    // Mise à jour de fieldsToValidate pour un coach
                    fieldsToValidate = ['accountType', 'licenceNumber'];
                } else if (value === 'visitor') {
                    // Pour un visiteur, on réinitialise les champs de licence et de joueur
                    updatedDetails.playerName = '';
                    updatedDetails.playerNumber = '';
                    updatedDetails.licenceNumber = '';
                    // Ajustez selon ce qui est nécessaire pour un visiteur
                    fieldsToValidate = ['accountType'];
                } else if (value === 'player') {
                    // Pour un joueur, assurez-vous que les champs requis sont inclus
                    fieldsToValidate = ['accountType', 'licenceNumber', 'playerName', 'playerNumber'];
                }
            }
    
            return updatedDetails;
        });
    };
    

    const validateFields = (fieldsToValidate, step) => {

        const requiredFields = fieldsToValidate.concat(
            ...(userDetails.accountType === "player" && step === 3 ? ['playerName', 'playerNumber', 'licenceNumber'] : []),
            ...(userDetails.accountType === "coach" && step === 3 ? ['licenceNumber'] : [])
        );        

        const missingField = requiredFields.find(field => !userDetails[field]);
        if (missingField) {
            Alert.alert('Erreur', `Veuillez remplir tous les champs obligatoires (marqués d'une étoile).`);
            return false;
        }

        if (step === 1) {
            const EMAIL_REGEX = /(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+(?:[A-Z]{2,}|[a-zA-Z]{2,}\d{0,2})(?<!-)/;
            if (!EMAIL_REGEX.test(userDetails.email)) {
                Alert.alert('Erreur', 'Veuillez saisir une adresse mail valide.');
                return false;
            }

            const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if(!PASSWORD_REGEX.test(userDetails.password)) {
                Alert.alert('Erreur', 'Le mot de passe ne respecte pas les exigences de sécurité.');
                return false;
            }

            if (fieldsToValidate.includes('password') && userDetails.password !== userDetails.passwordConfirm) {
                Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
                return false;
            }
        }
        if (step === 2) {
            const nameRegex = /^[a-zA-ZàâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ' -]+$/;
            if (!nameRegex.test(userDetails.firstname)) {
                Alert.alert("Erreur", "Merci d'indiquer un prénom valide");
                return false;
            }
            if (!nameRegex.test(userDetails.lastname)) {
                Alert.alert("Erreur", "Merci d'indiquer un nom valide");
                return false;
            }
            if (userDetails.birthday && calculateAge(userDetails.birthday) < 5) {
                Alert.alert("Erreur", "L'âge minimum pour être inscrit est de 5 ans.");
                return false;
            }
            if (userDetails.city.trim() && !citiesData.some((city) => city.Nom_commune.toLowerCase() === userDetails.city.toLowerCase().trim())) {
                Alert.alert("Erreur", "Veuillez sélectionner une ville valide de la liste. Si elle n'est pas présente, vous pouvez indiquer une ville voisine.");
                return false;
            }
        }

        return true;
    };

    const handleSignUp = (onSuccess) => {
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
                        if(onSuccess) onSuccess();
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
