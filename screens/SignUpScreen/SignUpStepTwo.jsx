import { View, TextInput, Button, Text, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import citiesData from '../../data/citiesFR.json';
import { useState } from 'react';
import styles from './styles';
import ModalDateTimePicker from 'react-native-modal-datetime-picker';
import { useSignUp } from '../../context/SignUpContext';


const SignUpStepTwo = ({ onPrevious, onNext }) => {
    const { userDetails, handleChange, validateFields, calculateAge, formatDateToDDMMYYYY } = useSignUp();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
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
        <View style={styles.container}>
            <Text style={styles.title}>STEP 2: Informations personnelles</Text>
            <TextInput
                style={styles.input}
                placeholder="Prénom *"
                value={userDetails.firstname}
                onChangeText={(text) => handleChange('firstname', text)}
            />
            <TextInput
                style={styles.input}
                placeholder="Nom *"
                value={userDetails.lastname}
                onChangeText={(text) => handleChange('lastname', text)}
            />

            <View style={styles.cities}>
                <TextInput
                    style={styles.input}
                    placeholder="Rechercher une ville"
                    value={userDetails.city ? userDetails.city : searchQuery}
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

            <View style={{ zIndex: -1 }}>
                <View style={styles.birthdayBlock}>
                    {Platform.OS === 'android' && (
                        <>
                            <Button title="Choisir la date" onPress={showDatePicker} />
                            <ModalDateTimePicker
                                isVisible={isDatePickerVisible}
                                mode="date"
                                onConfirm={(selectedDate) => {
                                    handleChange('birthday', selectedDate.toISOString().split('T')[0]);
                                    hideDatePicker();
                                }}
                                onCancel={hideDatePicker}
                                maximumDate={new Date()}
                            />
                        </>
                    )}
                    {Platform.OS === 'ios' && (
                        <DateTimePicker
                            value={new Date(userDetails.birthday)}
                            mode="date"
                            display="spinner"
                            onChange={(event, selectedDate) => {
                                handleChange('birthday', selectedDate.toISOString().split('T')[0]);
                            }}
                            maximumDate={new Date()}
                        />
                    )}
                    <Text>Âge: {calculateAge(userDetails.birthday)} an{calculateAge(userDetails.birthday) > 1 && "s"}</Text>
                    <Text>Né le : {formatDateToDDMMYYYY(userDetails.birthday)}</Text>
                </View>


                <Button title="Précédent" onPress={onPrevious} style={styles.button} />
                <Button title="Suivant" onPress={() => {
                    if (validateFields(['firstname', 'lastname', 'birthday'], 2)) {
                        onNext();
                    }
                }} style={styles.button} />
            </View>
        </View>
    );
};

export default SignUpStepTwo;
