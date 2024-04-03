import { useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app, db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const auth = getAuth(app);

export default function SignUp() {
  const [userDetails, setUserDetails] = useState({
    email: null,
    password: null,
    passwordConfirm: null,
    firstname: null,
    lastname: null,
    birthday: new Date().toISOString().split('T')[0],
    city: null,
    accountType: null,
    licenceNumber: null,
    playerName: null,
    playerNumber: null,
  });

  const handleChange = (name, value) => {
    setUserDetails(prevDetails => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const validateFields = () => {
    const requiredFields = [
      'email',
      'password',
      'passwordConfirm',
      'firstname',
      'lastname',
      'birthday',
      'accountType',
      ...(userDetails.accountType === "player" ? ['playerName', 'playerNumber', 'licenceNumber'] : []),
      ...(userDetails.accountType === "coach" ? ['licenceNumber'] : [])
    ];

    const missingField = requiredFields.find(field => !userDetails[field]);
    if (missingField) {
      Alert.alert('Erreur', `Veuillez remplir tous les champs obligatoires. Champ manquant: ${missingField}`);
      return false;
    }

    if (userDetails.password !== userDetails.passwordConfirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return false;
    }

    return true;
  };

  const handleSignUp = () => {
    if (!validateFields()) return;

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
      default: return 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.';
    }
  };

  return (
    <View>
      <Text>STEP 1 : information de connexion</Text>
      <TextInput
        testID='email'
        placeholder="Email *"
        value={userDetails.email}
        onChangeText={(text) => handleChange('email', text)}
      />
      <TextInput
        testID='password'
        placeholder="Mot de passe *"
        value={userDetails.password}
        onChangeText={(text) => handleChange('password', text)}
        secureTextEntry
      />
      <TextInput
        testID='passwordConfirm'
        placeholder="Confirmer votre mot de passe *"
        value={userDetails.passwordConfirm}
        onChangeText={(text) => handleChange('passwordConfirm', text)}
        secureTextEntry
      />
      <Button title='Suivant' />
      <Text>STEP 2 : informations personnelles</Text>
      <TextInput
        testID='firstname'
        placeholder="Prénom *"
        value={userDetails.firstname}
        onChangeText={(text) => handleChange('firstname', text)}
      />
      <TextInput
        testID='lastname'
        placeholder="Nom *"
        value={userDetails.lastname}
        onChangeText={(text) => handleChange('lastname', text)}
      />
      <DateTimePicker
        testID='birthday'
        value={userDetails.birthday ? new Date(userDetails.birthday) : new Date()}
        mode="date"
        display="default"
        onChange={(event, selectedDate) => {
          const currentDate = selectedDate ? selectedDate : new Date(userDetails.birthday || Date.now());
          setUserDetails(prevDetails => ({
            ...prevDetails,
            birthday: currentDate.toISOString().split('T')[0],
          }));
        }}
      />
      <TextInput
        testID='city'
        placeholder="Ville"
        value={userDetails.city}
        onChangeText={(text) => handleChange('city', text)}
      />
      <Button title='Précédent' />
      <Button title='Suivant' />
      <Text>STEP 3 : informations professionnels</Text>
      <Picker
        testID='accountType'
        selectedValue={userDetails.accountType}
        onValueChange={itemValue =>
          setUserDetails(prevDetails => ({
            ...prevDetails,
            accountType: itemValue
          }))
        }>
        <Picker.Item label="Choisir" />
        <Picker.Item label="Joueur" value="player" />
        <Picker.Item label="Entraîneur" value="coach" />
        <Picker.Item label="Visiteur" value="visitor" />
      </Picker>
      {(userDetails.accountType === "player" || userDetails.accountType === "coach") && (
        <TextInput
          testID='licenceNumber'
          placeholder="Numéro de licence *"
          value={userDetails.licenceNumber}
          onChangeText={(text) => handleChange('licenceNumber', text)}
        />
      )}
      {userDetails.accountType === "player" && (
        <>
          <TextInput
            testID='playerName'
            placeholder="Nom de joueur *"
            value={userDetails.playerName}
            onChangeText={(text) => handleChange('playerName', text)}
          />
          <TextInput
            testID='playerNumber'
            placeholder="Numéro de joueur *"
            value={userDetails.playerNumber}
            onChangeText={(text) => handleChange('playerNumber', text)}
          />
        </>
      )}
      <Button testID='signupButton' title="S'inscrire" onPress={handleSignUp} />
    </View>
  );
}