import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../styles/colors';

const SquareButtonIcon = ({ onPress, IconComponent, iconName, iconSize }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={styles.button}
        >
            <IconComponent name={iconName} size={iconSize || 24} color={colors.darkgrey} />
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
    }
});

export default SquareButtonIcon;
