import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import uuid from 'react-native-uuid';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import citiesData from '../../data/citiesFR.json';
import { Picker } from '@react-native-picker/picker';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import globalStyles from '../../styles/globalStyles';
import FunctionButtonMini from '../../components/FunctionButtonMini';
import Spacer from '../../components/Spacer';
import defaultImage from '../../assets/default-image.png';
import colors from '../../styles/colors';
import CustomTextInput from '../../components/CustomTextInput';
import { Label } from '../../components/TextComponents';
import FunctionButton from '../../components/FunctionButton';
import { LinearGradient } from 'expo-linear-gradient';
import { darkenColor } from '../../utils/colors';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useLoading } from '../../context/LoadingContext';

function CreateTeamForm({ user }) {
    const team_id = uuid.v4();
    const [imageUri, setImageUri] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const nameRegex = /^[a-zA-ZàâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ' -]+$/;
    const navigation = useNavigation();
    const { setIsLoading } = useLoading();

    const colors = {
        red: '#FF0000',
        orange: '#FFA500',
        yellow: '#F7DE3A',
        green: '#008000',
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

    const colorKeys = Object.keys(colors);
    const firstRowColors = colorKeys.slice(0, Math.ceil(colorKeys.length / 2));
    const secondRowColors = colorKeys.slice(Math.ceil(colorKeys.length / 2));
    
    const [teamDetails, setTeamDetails] = useState({
        id: '',
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
                onPress={() => handleChange(colorField, colors[colorName])}
            >
                <View style={isSelected && { borderWidth: 3, borderColor: darkenColor(colors[colorName], -20), borderRadius: 8, position: 'relative' }}>
                    <LinearGradient
                        colors={[colors[colorName], darkenColor(colors[colorName], -30)]}
                        locations={[0.3, 1]}
                        style={[
                            styles.colorButton,
                            isSelected && styles.selectedColorButton
                        ]}
                    />
                    {isSelected && (
                        <FontAwesome
                            name="check"
                            size={20}
                            color="white"
                            style={[styles.checkIcon, {color: colorName === "white" ? darkenColor(colors[colorName], -50) : 'white'} ]}
                        />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const pickImage = async () => {
        setIsLoading(true);
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
            setIsLoading(false);
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
        setIsLoading(false);
    };

    const addTeamToUser = async (userId, teamId) => {
        const userRef = doc(db, 'utilisateurs', userId);
        try {
            await updateDoc(userRef, {
                teams: arrayUnion(teamId)
            });
        } catch (error) {
            console.error("Erreur lors de l'ajout du club :", error);
        }
    };

    const handleSaveTeam = async () => {
        setIsLoading(true);
        if (user.accountType !== 'coach') {
            Alert.alert("Erreur", "La création de clubs n'est disponible que pour les coachs.")
            setIsLoading(false);
            return false;
        }

        const requiredFields = [
            'color_int', 'color_ext', 'city', 'category'
        ];

        const missingFields = requiredFields.filter(field => !teamDetails[field].trim());

        if (missingFields.length > 0 || !imageUri.trim()) {
            Alert.alert('Erreur', `Veuillez remplir tous les champs requis.`);
            setIsLoading(false);
            return;
        }

        if (teamDetails.city.trim() && !citiesData.some((city) =>
            city.Nom_commune.toLowerCase() === teamDetails.city.toLowerCase().trim())) {
            Alert.alert("Erreur", "Veuillez sélectionner une commune valide de la liste. Si elle n'est pas présente, vous pouvez indiquer une commune voisine.");
            setIsLoading(false);
            return;
        }

        if (!nameRegex.test(teamDetails.name)) {
            Alert.alert("Erreur", "Merci d'indiquer un nom de club valide.");
            setIsLoading(false);
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
                    id: team_id,
                    logo_link: downloadURL,
                    name: teamDetails.name.trim(),
                    active: true,
                };

                const teamRef = doc(db, 'equipes', team_id);
                await setDoc(teamRef, teamDatas);
                await addTeamToUser(user.uid, team_id);

                // Alert.alert("Succès", "Le club a été enregistré avec succès.");

                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{
                            name: 'InviteFirstPlayer',
                            params: {
                                teamId: team_id
                            },
                        }],
                    })
                );
            }
        } catch (error) {
            console.error("Une erreur est survenue :", error);
            Alert.alert("Erreur", "Une erreur est survenue lors de l'enregistrement du club.");
        } finally {
            setIsLoading(false);
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
        <SafeAreaView>
            <View style={{ height: 1, backgroundColor: colors.lightgrey, marginHorizontal: 30 }} />
            <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
                {imageUri ? (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: imageUri }}
                            style={styles.logo}
                        />
                    </View>
                ) : (
                    <View style={styles.imageContainer}>
                        <Image
                            source={defaultImage}
                            style={styles.logo}
                        />
                    </View>
                )}
                <View style={{ paddingHorizontal: '20%' }}>
                    <FunctionButtonMini
                        title="Sélectionner le logo"
                        onPress={pickImage}
                        variant='secondary'
                    />
                </View>
                <Spacer />
                <CustomTextInput
                    label="Nom du club *"
                    placeholder="Choisissez le nom du club"
                    value={teamDetails.name}
                    onChangeText={(text) => handleChange('name', text)}
                />
                <View style={{ gap: 5, paddingTop: 15 }}>
                    <Label>Catégorie</Label>
                    <Picker
                        selectedValue={teamDetails.category}
                        onValueChange={(itemValue) => handleChange('category', itemValue)}>
                        <Picker.Item label="Choisir la catégorie" value="" />
                        {categories.map((category, index) => (
                            <Picker.Item key={index} label={category} value={category} />
                        ))}
                    </Picker>
                </View>
                <View style={styles.cities}>
                    <CustomTextInput
                        label="Commune"
                        placeholder="Choisissez la commune du club"
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
                                        style={styles.city}
                                    >
                                        {nomCommune}
                                    </Text>
                                ))}
                        </View>
                    )}
                </View>
                <Spacer />

                <Label>Couleur principale</Label>
                <View style={styles.colorsContainer}>
                    {firstRowColors.map((color) => (
                        <ColorButton key={`${color}_int`} colorName={color} colorField="color_int" />
                    ))}
                </View>
                <View style={styles.colorsContainer}>
                    {secondRowColors.map((color) => (
                        <ColorButton key={`${color}_int`} colorName={color} colorField="color_int" />
                    ))}
                </View>

                <Spacer />
                <Label>Couleur secondaire</Label>
                <View style={styles.colorsContainer}>
                    {firstRowColors.map((color) => (
                        <ColorButton key={`${color}_ext`} colorName={color} colorField="color_ext" />
                    ))}
                </View>
                <View style={styles.colorsContainer}>
                    {secondRowColors.map((color) => (
                        <ColorButton key={`${color}_ext`} colorName={color} colorField="color_ext" />
                    ))}
                </View>

                <Spacer />
                <FunctionButton
                    title="Créer le club"
                    onPress={handleSaveTeam}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    imageContainer: {
        alignItems: 'center',
        marginVertical: 20
    },
    logo: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
        borderRadius: 10,
    },
    citiesList: {
        backgroundColor: 'white',
        gap: 5,
        marginTop: 5,
        width: '100%',
    },
    city: {
        padding: 11,
        borderWidth: 2,
        borderRadius: 8,
        borderColor: colors.secondary,
    },
    colorsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 5,
    },
    colorButton: {
        width: 45,
        height: 45,
        borderRadius: 8,
    },
    selectedColorButton: {
        width: 39,
        height: 39,
        borderWidth: 3,
        borderColor: 'white',
        borderRadius: 5,
    },
    checkIcon: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -10 }, { translateY: -10 }],
        color: 'white'
    },
});

export default CreateTeamForm;