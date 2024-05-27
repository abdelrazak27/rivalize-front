import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../styles/colors';

const SquareButtonIcon = ({ onPress, IconComponent, iconName, iconSize, isFocused, disabled, iconColor, height, width }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.button, isFocused && styles.buttonFocused, disabled && styles.disabledButton, height && { height: height }, width && { width: width } ]}
            disabled={disabled}
        >
            <IconComponent name={iconName} size={iconSize || 24} color={iconColor ? disabled ? colors.secondary : iconColor : colors.darkgrey} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderColor: colors.lightgrey,
        borderWidth: 2,
        borderRadius: 10,
        height: 50,
        width: 50
    },
    buttonFocused: {
        borderColor: colors.primary,
    },
    disabledButton: {
        borderColor: colors.secondary,
    }
});

export default SquareButtonIcon;
