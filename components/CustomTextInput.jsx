import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import colors from '../styles/colors';
import { fonts } from '../styles/fonts';

const CustomTextInput = ({ label, placeholder, value, onChangeText, secureTextEntry = false, keyboardType, readOnly }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View>
            {label && <Text style={[
                styles.label,
                readOnly && { color: colors.secondary, fontFamily: fonts.OutfitBold }
            ]}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    isFocused && { borderColor: colors.primary },
                    readOnly && { color: colors.secondary, fontFamily: fonts.OutfitSemiBold }
                ]}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                autoCapitalize='none'
                clearTextOnFocus={false}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType={keyboardType && keyboardType}
                readOnly={readOnly}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        marginBottom: 5,
        fontFamily: fonts.OutfitSemiBold,
        fontSize: 15,
        color: colors.black,
    },
    input: {
        height: 46,
        borderColor: colors.lightgrey,
        borderWidth: 2,
        borderRadius: 8,
        paddingHorizontal: 10,
        fontFamily: fonts.OutfitRegular,
        fontSize: 15,
        color: colors.black,
    },
});

export default CustomTextInput;
