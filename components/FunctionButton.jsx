import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../styles/colors';
import { fonts } from '../styles/fonts';

const FunctionButton = ({ title, onPress, disabled, variant = 'primary' }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.button,
                variant === 'secondary' && styles.buttonSecondary,
                variant === 'error' && styles.buttonError,
                variant === 'errorOutline' && styles.buttonErrorOutline,
                variant === 'primaryOutline' && styles.buttonPrimaryOutline,
                variant === 'secondaryOutline' && styles.buttonSecondaryOutline,
                disabled && (
                    variant === 'primary' ? styles.buttonDisabled :
                    variant === 'secondary' ? styles.buttonSecondaryDisabled :
                    variant === 'error' ? styles.buttonErrorDisabled :
                    variant === 'errorOutline' ? styles.buttonErrorDisabledOutline :
                    variant === 'primaryOutline' ? styles.buttonPrimaryOutlineDisabled :
                    styles.buttonSecondaryOutlineDisabled
                )
            ]}
        >
            <Text style={[
                styles.buttonText,
                variant === 'primaryOutline' && (disabled ? styles.buttonTextPrimaryOutlineDisabled : styles.buttonTextPrimaryOutline),
                variant === 'secondaryOutline' && (disabled ? styles.buttonTextSecondaryOutlineDisabled : styles.buttonTextSecondaryOutline),
                variant === 'errorOutline' && (disabled ? styles.buttonTextErrorOutlineDisabled : styles.buttonTextErrorOutline)
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
        borderRadius: 8,
    },
    buttonSecondary: {
        backgroundColor: colors.secondary,
    },
    buttonError: {
        backgroundColor: colors.error,
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
    buttonErrorOutline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.error,
    },
    buttonDisabled: {
        backgroundColor: colors.primary + '99',
    },
    buttonSecondaryDisabled: {
        backgroundColor: colors.secondary + '99',
    },
    buttonErrorDisabled: {
        backgroundColor: colors.error + '99',
    },
    buttonPrimaryOutlineDisabled: {
        borderColor: colors.primary + '99',
    },
    buttonSecondaryOutlineDisabled: {
        borderColor: colors.secondary + '99',
    },
    buttonErrorOutlineDisabled: {
        borderColor: colors.error + '99',
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
    buttonTextErrorOutline: {
        color: colors.error,
    },
    buttonTextPrimaryOutlineDisabled: {
        color: colors.primary + '99',
    },
    buttonTextSecondaryOutlineDisabled: {
        color: colors.secondary + '99',
    },
    buttonTextErrorOutlineDisabled: {
        color: colors.error + '99',
    }
});

export default FunctionButton;
