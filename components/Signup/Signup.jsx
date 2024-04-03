import { useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app, db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';


const auth = getAuth(app);

export default function SignUp() {

  const [userDetails, setUserDetails] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    firstname: '',
    lastname: '',
    birthday: '', 
    city: '',
    accountType: '',
    licenceNumber: '', 
    playerName: '',
    playerNumber: '', 
  });

  const handleChange = (name, value) => {
    setUserDetails(prevDetails => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const missingField = [
    'email',
    'password',
    'passwordConfirm',
    'firstname',
    'lastname',
    'birthday',
    'accountType',
    'licenceNumber',
    ...(userDetails.accountType === "player" ? ['playerName', 'playerNumber'] : []),
  ].find(field => !userDetails[field]);

  const handleSignUp = () => {
    if (missingField) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (userDetails.password !== userDetails.passwordConfirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return; 
    }

    createUserWithEmailAndPassword(auth, userDetails.email, userDetails.password)
      .then(userCredentials => {
        const user = userCredentials.user;
        console.log('*****');
        console.log('Un nouveau compte vient d\'être créé');
        console.log('UID   : ', user.uid);
        console.log('Email : ', user.email);
        console.log('*****');

        const userRef = doc(db, 'utilisateurs', user.uid);
        setDoc(userRef, {
          firstname: userDetails.firstname,
          lastname: userDetails.lastname,
          birthday: userDetails.birthday,
          city: userDetails.city,
          account_type: userDetails.accountType,
          licence_number: userDetails.licenceNumber,
          player_name: userDetails.playerName,
          player_number: userDetails.playerNumber
          
        })
        .then(() => {
          console.log('Utilisateur ajouté à Firestore avec succès');
        })
        .catch((error) => {
          console.error('Erreur lors de l\'ajout de l\'utilisateur à Firestore: ', error);
        });

      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = getErrorMessage(errorCode);
        Alert.alert('Erreur d\'inscription', errorMessage);
      });
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Cette adresse email est déjà utilisée par un autre compte.';
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères.';
      case 'auth/invalid-email':
        return 'L\'adresse email saisie n\'est pas valide.';
      default:
        return 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.';
    }
  };

  return (
    <View>
      <Text>STEP 1 : information de connexion</Text>
      <TextInput
        placeholder="Email *"
        value={userDetails.email}
        onChangeText={(text) => handleChange('email', text)}
      />
      <TextInput
        placeholder="Mot de passe *"
        value={userDetails.password}
        onChangeText={(text) => handleChange('password', text)}
        secureTextEntry
      />
      <TextInput
        placeholder="Confirmer votre mot de passe *"
        value={userDetails.passwordConfirm}
        onChangeText={(text) => handleChange('passwordConfirm', text)}
        secureTextEntry
      />
      <Button title='Suivant' />
      <Text>STEP 2 : informations personnelles</Text>
      <TextInput
        placeholder="Prénom *"
        value={userDetails.firstname}
        onChangeText={(text) => handleChange('firstname', text)}
      />
      <TextInput
        placeholder="Nom *"
        value={userDetails.lastname}
        onChangeText={(text) => handleChange('lastname', text)}
      />

      <DateTimePicker
        testID="dateTimePicker"
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
        placeholder="Ville"
        value={userDetails.city}
        onChangeText={(text) => handleChange('city', text)}
      />
      <Button title='Précédent' />
      <Button title='Suivant' />
      <Text>STEP 3 : informations professionnels</Text>
      <TextInput
        placeholder="Type de compte *"
        value={userDetails.accountType}
        onChangeText={(text) => handleChange('accountType', text)}
      />
      <TextInput
        placeholder="Numéro de licence *"
        value={userDetails.licenceNumber}
        onChangeText={(text) => handleChange('licenceNumber', text)}
      />
      <TextInput
        placeholder="Nom de joueur *"
        value={userDetails.playerName}
        onChangeText={(text) => handleChange('playerName', text)}
      />
      <TextInput
        placeholder="Numéro de joueur *"
        value={userDetails.playerNumber}
        onChangeText={(text) => handleChange('playerNumber', text)}
      />
      <Button title="S'inscrire" onPress={handleSignUp} />
    </View>
  );
}