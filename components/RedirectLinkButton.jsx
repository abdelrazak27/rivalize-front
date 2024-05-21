import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../styles/colors';
import { fonts } from '../styles/fonts';

const RedirectLinkButton = ({ routeName, title, params, disabled, variant = 'primary' }) => {
    const navigation = useNavigation();

    const handlePress = () => {
        if (!disabled) {
            navigation.navigate(routeName, params);
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={disabled}
            style={[
                styles.button,
                variant === 'secondary' && styles.buttonSecondary,
                variant === 'primaryOutline' && styles.buttonPrimaryOutline,
                variant === 'secondaryOutline' && styles.buttonSecondaryOutline,
                disabled && (
                    variant === 'primary' ? styles.buttonDisabled :
                    variant === 'secondary' ? styles.buttonSecondaryDisabled :
                    variant === 'primaryOutline' ? styles.buttonPrimaryOutlineDisabled :
                    styles.buttonSecondaryOutlineDisabled
                )
            ]}
        >
            <Text style={[
                styles.buttonText,
                variant === 'primaryOutline' && (disabled ? styles.buttonTextPrimaryOutlineDisabled : styles.buttonTextPrimaryOutline),
                variant === 'secondaryOutline' && (disabled ? styles.buttonTextSecondaryOutlineDisabled : styles.buttonTextSecondaryOutline)
            ]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: '100%',
        height: 46,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
    },
    buttonSecondary: {
        backgroundColor: colors.secondary,
    },
    buttonPrimaryOutline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    buttonSecondaryOutline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.secondary,
    },
    buttonDisabled: {
        backgroundColor: colors.primary + '99',
    },
    buttonSecondaryDisabled: {
        backgroundColor: colors.secondary + '99',
    },
    buttonPrimaryOutlineDisabled: {
        borderColor: colors.primary + '99',
    },
    buttonSecondaryOutlineDisabled: {
        borderColor: colors.secondary + '99',
    },
    buttonText: {
        color: 'white',
        fontFamily: fonts.OutfitBold,
        fontSize: 15,
    },
    buttonTextPrimaryOutline: {
        color: colors.primary,
    },
    buttonTextSecondaryOutline: {
        color: colors.secondary,
    },
    buttonTextPrimaryOutlineDisabled: {
        color: colors.primary + '99',
    },
    buttonTextSecondaryOutlineDisabled: {
        color: colors.secondary + '99',
    }
});

export default RedirectLinkButton;
