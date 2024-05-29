import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Image, ScrollView } from 'react-native';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import citiesData from '../../data/citiesFR.json';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import globalStyles from '../../styles/globalStyles';
import FunctionButtonMini from '../../components/FunctionButtonMini';
import Spacer from '../../components/Spacer';
import CustomTextInput from '../../components/CustomTextInput';
import { Label } from '../../components/TextComponents';
import colors from '../../styles/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { darkenColor } from '../../utils/colors';
import FunctionButton from '../../components/FunctionButton';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useUser } from '../../context/UserContext';

function EditTeamScreen({ route }) {
    const navigation = useNavigation();
    const { user } = useUser();
    const { teamData } = route.params;
    const [name, setName] = useState(teamData.name);
    const [category, setCategory] = useState(teamData.category);
    const [city, setCity] = useState(teamData.city);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const [colorExt, setColorExt] = useState(teamData.color_ext);
    const [colorInt, setColorInt] = useState(teamData.color_int);
    const [logoLink, setLogoLink] = useState(teamData.logo_link);
    const nameRegex = /^[a-zA-ZàâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ' -]+$/;
    const [isModified, setIsModified] = useState(false);

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
    ];

    const ColorButton = ({ colorName, colorField }) => {
        const isSelected = (colorField === 'color_int' ? colorInt : colorExt) === colors[colorName];
        return (
            <TouchableOpacity
                onPress={() => {
                    if (colorField === 'color_int') {
                        setColorInt(colors[colorName]);
                    } else {
                        setColorExt(colors[colorName]);
                    }
                }}
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
            setLogoLink(result.assets[0].uri);
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

    const handleSaveChanges = () => {
        if (user.accountType !== 'coach') {
            Alert.alert("Erreur", "La modification de clubs n'est disponible que pour le coach.");
            return false;
        }
    
        if (!name.trim() || !city.trim()) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs.");
            return;
        }
    
        if (!category || category === "Choisir la catégorie") {
            Alert.alert("Erreur", "Veuillez sélectionner une catégorie valide.");
            return;
        }
    
        if (city.trim() && !citiesData.some((cityData) =>
            cityData.Nom_commune.toLowerCase() === city.toLowerCase().trim())) {
            Alert.alert("Erreur", "Veuillez sélectionner une commune valide de la liste. Si elle n'est pas présente, vous pouvez indiquer une commune voisine.");
            return;
        }
    
        if (!nameRegex.test(name)) {
            Alert.alert("Erreur", "Veuillez indiquer un nom de club valide.");
            return;
        }
    
        Alert.alert(
            "Confirmer les modifications",
            "Êtes-vous sûr de vouloir enregistrer ces modifications ?",
            [
                { text: "Annuler", style: "cancel" },
                { text: "Confirmer", onPress: () => saveChanges() }
            ]
        );
    };    

    const saveChanges = async () => {
        const teamRef = doc(db, 'equipes', teamData.id);
        try {
            await updateDoc(teamRef, {
                name,
                category,
                city,
                color_ext: colorExt,
                color_int: colorInt,
                logo_link: logoLink
            });
            navigation.goBack();
        } catch (error) {
            Alert.alert("Erreur", "Une erreur est survenue lors de la mise à jour des informations.");
        }
    };

    const checkIfModified = () => {
        return (
            name !== teamData.name ||
            category !== teamData.category ||
            city !== teamData.city ||
            colorExt !== teamData.color_ext ||
            colorInt !== teamData.color_int ||
            logoLink !== teamData.logo_link
        );
    };

    useEffect(() => {
        setIsModified(checkIfModified());
    }, [name, category, city, colorExt, colorInt, logoLink]);

    const colorKeys = Object.keys(colors);
    const firstRowColors = colorKeys.slice(0, Math.ceil(colorKeys.length / 2));
    const secondRowColors = colorKeys.slice(Math.ceil(colorKeys.length / 2));

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={{ height: 1, backgroundColor: colors.lightgrey, marginHorizontal: 30 }} />
            <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
                {logoLink && (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: logoLink }}
                            style={styles.logo}
                        />
                    </View>
                )}
                <View style={{ paddingHorizontal: '20%' }}>
                    <FunctionButtonMini
                        title="Changer le logo"
                        onPress={pickImage}
                        variant='secondary'
                    />
                </View>
                <Spacer />
                <CustomTextInput
                    label="Nom du club"
                    placeholder="Choisissez le nom du club"
                    value={name}
                    onChangeText={setName}
                />
                <View style={{ gap: 5, paddingTop: 15 }}>
                    <Label>Catégorie</Label>
                    <Picker
                        selectedValue={category}
                        onValueChange={(itemValue) => setCategory(itemValue)}>
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
                        value={city ? city : searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            setCity(text);
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
                                            setCity(nomCommune);
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
                    title="Enregistrer les modifications"
                    onPress={handleSaveChanges}
                    disabled={!isModified}
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
        transform: [{ translateX: -10 }, { translateY: -10 }], // 10 étant la moitié de 20, la taille de l'icone
        color: 'white'
    },
});
export default EditTeamScreen;
