import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import citiesData from '../../data/citiesFR.json';
import { Picker } from '@react-native-picker/picker';

function EditTeamScreen({ route }) {
    const navigation = useNavigation();
    const { teamData } = route.params;
    const [name, setName] = useState(teamData.name);
    const [category, setCategory] = useState(teamData.category);
    const [city, setCity] = useState(teamData.city);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const [colorExt, setColorExt] = useState(teamData.color_ext);
    const [colorInt, setColorInt] = useState(teamData.color_int);
    const [logoLink, setLogoLink] = useState(teamData.logo_link);

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

    const ColorButton = ({ colorName, colorField }) => {
        const isSelected = (colorField === 'color_int' ? colorInt : colorExt) === colors[colorName];
        return (
            <TouchableOpacity
                style={[
                    styles.colorButton,
                    { backgroundColor: colors[colorName] },
                    isSelected && styles.selectedColorButton
                ]}
                onPress={() => {
                    if (colorField === 'color_int') {
                        setColorInt(colors[colorName]);
                    } else {
                        setColorExt(colors[colorName]);
                    }
                }}
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

    return (
        <View style={styles.container}>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nom de l'équipe" />

            <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}>
                <Picker.Item label="Choisir la catégorie" value="" />
                {categories.map((category, index) => (
                    <Picker.Item key={index} label={category} value={category} />
                ))}
            </Picker>

            <View style={styles.cities}>
                <TextInput
                    placeholder="Rechercher une ville"
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
                                    style={{ padding: 10 }}
                                >
                                    {nomCommune}
                                </Text>
                            ))}
                    </View>
                )}
            </View>
            
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
            {logoLink && (
                <Image source={{ uri: logoLink }} style={styles.logo} />
            )}
            <Button title="Enregistrer les modifications" onPress={handleSaveChanges} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#fff'
    },
    input: {
        height: 40,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10
    },
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
    logo: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        marginVertical: 10,
    }
});
export default EditTeamScreen;