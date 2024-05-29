import { View, TextInput, Button, Text, Platform, ScrollView, Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import citiesData from '../../data/citiesFR.json';
import { useState } from 'react';
import styles from './styles';
import ModalDateTimePicker from 'react-native-modal-datetime-picker';
import { useSignUp } from '../../context/SignUpContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Label, Subtitle, Title } from '../../components/TextComponents';
import CustomTextInput from '../../components/CustomTextInput';
import FunctionButton from '../../components/FunctionButton';
import colors from '../../styles/colors';


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

    const isButtonDisabled = userDetails.firstname.length === 0 || userDetails.lastname.length === 0 || userDetails.city.length === 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <Title>D'autres informations,</Title>
                <Subtitle>Nous avons besoin d'en savoir un peu plus sur vous</Subtitle>
            </View>
            
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
            >
                <View style={styles.inputs}>
                    <CustomTextInput
                        label="Prénom"
                        placeholder="Votre prénom"
                        value={userDetails.firstname}
                        onChangeText={(text) => handleChange('firstname', text)}
                    />
                    <CustomTextInput
                        label="Nom"
                        placeholder="Votre nom"
                        value={userDetails.lastname}
                        onChangeText={(text) => handleChange('lastname', text)}
                    />
                    <View style={styles.cities}>
                        <CustomTextInput
                            label="Commune"
                            placeholder="Votre commune"
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
                                            style={styles.city}
                                        >
                                            {nomCommune}
                                        </Text>
                                    ))}
                            </View>
                        )}
                    </View>
                    <View style={styles.birthdayBlock}>
                        <Label>Date de naissance</Label>
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
                        <Text style={[styles.indicationsInput, { textAlign: 'center', color: colors.darkgrey }]}>Âge: {calculateAge(userDetails.birthday)} an{calculateAge(userDetails.birthday) > 1 && "s"}</Text>
                    </View>
                </View>
                </ScrollView>

                <View
                    style={styles.buttons}
                >
                    <FunctionButton
                        title="Suivant"
                        onPress={async () => {
                            if (await validateFields(['firstname', 'lastname', 'birthday', 'city'], 2)) {
                                onNext();
                            }
                        }}
                        variant='primary'
                        disabled={isButtonDisabled}
                    />
                    <FunctionButton
                        title="Précédent"
                        onPress={onPrevious}
                        variant='primaryOutline'
                    />
                </View>
            
        </SafeAreaView>
    );
};

export default SignUpStepTwo;
