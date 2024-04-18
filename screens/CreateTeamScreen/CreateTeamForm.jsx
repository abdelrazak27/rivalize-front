import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import uuid from 'react-native-uuid';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import citiesData from '../SignUpScreen/data/citiesFR.json';
import { Picker } from '@react-native-picker/picker';
import { CommonActions, useNavigation } from '@react-navigation/native';


function CreateTeamForm({ user }) {
    const team_id = uuid.v4();
    const [imageUri, setImageUri] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const nameRegex = /^[a-zA-ZàâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ' -]+$/;
    const navigation = useNavigation();

    const colors = {
        red: '#FF0000',
        orange: '#FFA500',
        yellow: '#FFFF00',
        green: '#008000',
        navy: '#000080',
        blue: '#0000FF',
        purple: '#800080',
        pink: '#FFC0CB',
        grey: '#808080',
        white: '#FFFFFF',
        black: '#000000',
    };

    const categories = [
        'U6',
        'U6 F',
        'U7',
        'U7 F',
        'U8',
        'U8 F',
        'U9',
        'U9 F',
        'U10',
        'U10 F',
        'U11',
        'U11 F',
        'U12',
        'U12 F',
        'U13',
        'U13 F',
        'U14',
        'U14 F',
        'U15',
        'U15 F',
        'U16',
        'U16 F',
        'U17',
        'U17 F',
        'U18',
        'U18 F',
        'U19',
        'U19 F',
        'U20',
        'U20 F',
        'SENIOR',
        'SENIOR F',
        'SENIOR VETERAN'
    ]


    const [teamDetails, setTeamDetails] = useState({
        id: team_id,
        color_int: '',
        color_ext: '',
        logo_link: '',
        city: '',
        category: '',
        coach_id: user.uid,
        players: [],
        name: '',
    });

    const handleChange = (name, value) => {
        setTeamDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
    };

    const ColorButton = ({ colorName, colorField }) => {
        const isSelected = teamDetails[colorField] === colors[colorName];
        return (
            <TouchableOpacity
                style={[
                    styles.colorButton,
                    { backgroundColor: colors[colorName] },
                    isSelected && styles.selectedColorButton
                ]}
                onPress={() => handleChange(colorField, colors[colorName])}
            />
        );
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    const addTeamToUser = async (userId, teamId) => {
        const userRef = doc(db, 'utilisateurs', userId);
        try {
            await updateDoc(userRef, {
                teams: arrayUnion(teamId)
            });
        } catch (error) {
            console.error("Erreur lors de l'ajout de l'équipe :", error);
        }
    };

    const handleSaveTeam = async () => {

        if (user.accountType !== 'coach') {
            Alert.alert("Erreur", "La création d'équipe n'est disponible que pour les coachs.")
            return false;
        }

        const requiredFields = [
            'color_int', 'color_ext', 'city', 'category'
        ];

        const missingFields = requiredFields.filter(field => !teamDetails[field].trim());

        if (missingFields.length > 0 || !imageUri.trim()) {
            Alert.alert('Erreur', `Veuillez remplir tous les champs requis.`);
            return;
        }

        if (teamDetails.city.trim() && !citiesData.some((city) =>
            city.Nom_commune.toLowerCase() === teamDetails.city.toLowerCase().trim())) {
            Alert.alert("Erreur", "Veuillez sélectionner une ville valide de la liste. Si elle n'est pas présente, vous pouvez indiquer une ville voisine.");
            return;
        }

        if (!nameRegex.test(teamDetails.name)) {
            Alert.alert("Erreur", "Merci d'indiquer un nom de club valide");
            return false;
        }

        try {
            if (imageUri) {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                const fileRef = ref(storage, `images/teams/logo/${team_id}`);
                await uploadBytes(fileRef, blob);
                const downloadURL = await getDownloadURL(fileRef);

                const teamDatas = {
                    ...teamDetails,
                    logo_link: downloadURL,
                    name: teamDetails.name.trim(),
                };

                const teamRef = doc(db, 'equipes', team_id);
                await setDoc(teamRef, teamDatas);
                await addTeamToUser(user.uid, team_id);

                Alert.alert("Succès", "L'équipe a été enregistrée avec succès.");
                
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'InviteFirstPlayer' }],
                    })
                );
            }
        } catch (error) {
            console.error("Une erreur est survenue :", error);
            Alert.alert("Erreur", "Une erreur est survenue lors de l'enregistrement de l'équipe.");
        }
    };

    const filterCities = (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setFilteredCities([]);
            return;
        }
        const filtered = citiesData
            .filter((city) => city.Nom_commune.toUpperCase().startsWith(query.toUpperCase()))
            .slice(0, 10);
        setFilteredCities(filtered);
    };

    return (
        <View>
            <Text>Création de votre équipe</Text>
            <Text>Couleur intérieure :</Text>
            <View style={styles.colorsContainer}>
                {Object.keys(colors).map((color) => (
                    <ColorButton key={`${color}_int`} colorName={color} colorField="color_int" />
                ))}
            </View>

            <Text>Couleur extérieure :</Text>
            <View style={styles.colorsContainer}>
                {Object.keys(colors).map((color) => (
                    <ColorButton key={`${color}_ext`} colorName={color} colorField="color_ext" />
                ))}
            </View>


            <TouchableOpacity onPress={pickImage}>
                <Text>Sélectionner le logo</Text>
            </TouchableOpacity>

            <TextInput
                placeholder="Nom du club *"
                value={teamDetails.name}
                onChangeText={(text) => handleChange('name', text)}
            />

            <View style={styles.cities}>
                <TextInput
                    placeholder="Rechercher une ville"
                    value={teamDetails.city ? teamDetails.city : searchQuery}
                    onChangeText={(text) => {
                        setSearchQuery(text);
                        handleChange('city', text);
                        filterCities(text);
                    }}
                />

                {filteredCities.length > 0 && (
                    <View style={styles.citiesList}>
                        {Array.from(new Set(filteredCities.map(city => city.Nom_commune)))
                            .map((nomCommune, index) => (
                                <Text
                                    key={index}
                                    onPress={() => {
                                        handleChange('city', nomCommune);
                                        setFilteredCities([]);
                                        setSearchQuery(nomCommune);
                                    }}
                                    style={{ padding: 10 }}
                                >
                                    {nomCommune}
                                </Text>
                            ))}
                    </View>
                )}
            </View>

            <Picker
                selectedValue={teamDetails.category}
                onValueChange={(itemValue) => handleChange('category', itemValue)}>
                <Picker.Item label="Choisir la catégorie" value="" />
                {categories.map((category, index) => (
                    <Picker.Item key={index} label={category} value={category} />
                ))}
            </Picker>

            <TouchableOpacity onPress={handleSaveTeam}>
                <Text>Enregistrer l'équipe</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    colorsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 10,
    },
    colorButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginHorizontal: 5,
    },
    selectedColorButton: {
        borderWidth: 2,
        borderColor: 'black',
    },
});

export default CreateTeamForm;