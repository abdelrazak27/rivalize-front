import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { app, db } from '../firebaseConfig';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import citiesData from '../data/citiesFR.json';
import { useUser } from './UserContext';
import { useLoading } from './LoadingContext';

const SignUpContext = createContext();
const auth = getAuth(app);

export const useSignUp = () => useContext(SignUpContext);

export const SignUpProvider = ({ children }) => {
    const { user, setUser } = useUser();
    const { setIsLoading } = useLoading();
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

    const checkEmailExistsInFirestore = async (email) => {
        const q = query(collection(db, "utilisateurs"), where("email", "==", email.toLowerCase()));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    };

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
        setUserDetails((prevDetails) => {
            let updatedDetails = { ...prevDetails, [name]: value };

            if (name === 'accountType') {
                if (value === 'coach') {
                    updatedDetails.playerName = '';
                    updatedDetails.playerNumber = '';
                    fieldsToValidate = ['accountType', 'licenceNumber'];
                } else if (value === 'visitor') {
                    updatedDetails.playerName = '';
                    updatedDetails.playerNumber = '';
                    updatedDetails.licenceNumber = '';
                    fieldsToValidate = ['accountType'];
                } else if (value === 'player') {
                    fieldsToValidate = ['accountType', 'licenceNumber', 'playerName', 'playerNumber'];
                }
            }
            return updatedDetails;
        });
    };

    const validateFields = async (fieldsToValidate, step) => {
        const requiredFields = fieldsToValidate.concat(
            ...(userDetails.accountType === "player" && step === 3 ? ['playerName', 'playerNumber', 'licenceNumber'] : []),
            ...(userDetails.accountType === "coach" && step === 3 ? ['licenceNumber'] : [])
        );

        const missingField = requiredFields.find(field => !userDetails[field]);
        if (missingField) {
            Alert.alert('Erreur', `Veuillez remplir tous les champs obligatoires.`);
            return false;
        }

        if (step === 1) {
            setIsLoading(true);
            const emailExists = await checkEmailExistsInFirestore(userDetails.email.toLowerCase());
            if (emailExists) {
                setIsLoading(false);
                Alert.alert('Erreur', 'Cette adresse email est déjà utilisée.');
                return false;
            }

            const EMAIL_REGEX = /(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+(?:[A-Z]{2,}|[a-zA-Z]{2,}\d{0,2})(?<!-)/;
            if (!EMAIL_REGEX.test(userDetails.email)) {
                setIsLoading(false);
                Alert.alert('Erreur', 'Veuillez saisir une adresse mail valide.');
                return false;
            }

            const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!PASSWORD_REGEX.test(userDetails.password)) {
                setIsLoading(false);
                Alert.alert('Erreur', 'Le mot de passe ne respecte pas les exigences de sécurité.');
                return false;
            }

            if (fieldsToValidate.includes('password') && userDetails.password !== userDetails.passwordConfirm) {
                setIsLoading(false);
                Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
                return false;
            }
            setIsLoading(false);
        }
        if (step === 2) {
            setIsLoading(true);
            const nameRegex = /^[a-zA-ZàâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ' -]+$/;
            if (!nameRegex.test(userDetails.firstname)) {
                setIsLoading(false);
                Alert.alert("Erreur", "Merci d'indiquer un prénom valide.");
                return false;
            }
            if (!nameRegex.test(userDetails.lastname)) {
                setIsLoading(false);
                Alert.alert("Erreur", "Merci d'indiquer un nom valide.");
                return false;
            }
            if (userDetails.birthday && calculateAge(userDetails.birthday) < 5) {
                setIsLoading(false);
                Alert.alert("Erreur", "L'âge minimum pour s'inscrire est de 5 ans.");
                return false;
            }
            if (userDetails.city.trim() && !citiesData.some((city) => city.Nom_commune.toLowerCase() === userDetails.city.toLowerCase().trim())) {
                setIsLoading(false);
                Alert.alert("Erreur", "Veuillez sélectionner une commune valide de la liste. Si elle n'est pas présente, vous pouvez indiquer une commune voisine.");
                return false;
            }
            setIsLoading(false);
        }

        return true;
    };

    const handleSignUp = async (onSuccess, onFail) => {
        setIsLoading(true);
        try {
            const userCredentials = await createUserWithEmailAndPassword(auth, userDetails.email, userDetails.password);
            const userFirebase = userCredentials.user;
            const userData = {
                ...userDetails,
                email: userDetails.email.toLowerCase(),
                birthday: userDetails.birthday || new Date().toISOString().split('T')[0],
            };
            delete userData.password;
            delete userData.passwordConfirm;
            if (userDetails.accountType === "coach" || userDetails.accountType === "visitor") {
                delete userData.playerName;
                delete userData.playerNumber;
            }
            if (userDetails.accountType === "visitor") {
                delete userData.licenceNumber;
            }

            const userRef = doc(db, 'utilisateurs', userFirebase.uid);
            await setDoc(userRef, userData);
            setUser({ ...userDetails, uid: userFirebase.uid });
            setIsLoading(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur dans Firestore et dans Firebase : ', error);
            const errorMessage = getErrorMessage(error.code);
            Alert.alert('Erreur d\'inscription', errorMessage);
            setIsLoading(false);
            if (onFail) onFail();
        }
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
        <SignUpContext.Provider setUser={setUser} value={{ userDetails, handleChange, validateFields, handleSignUp, calculateAge, formatDateToDDMMYYYY, licenceValidationMessage, setLicenceValidationMessage }}>
            {children}
        </SignUpContext.Provider>
    );
};
