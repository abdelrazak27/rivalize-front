import React from 'react';
import { Text, StyleSheet } from 'react-native';
import colors from '../styles/colors';
import { fonts } from '../styles/fonts';

export const Title = ({ children }) => {
    return <Text style={styles.title}>{children}</Text>;
};

export const Subtitle = ({ children }) => {
    return <Text style={styles.subtitle}>{children}</Text>;
};

export const Label = ({ children }) => {
    return <Text style={styles.label}>{children}</Text>;
};

export const PrimaryColorText = ({ children }) => {
    return <Text style={styles.primaryColorText}>{children}</Text>;
};

const styles = StyleSheet.create({
    title: {
        fontFamily: fonts.OutfitBold,
        fontSize: 25,
        color: colors.black,
    },
    subtitle: {
        fontFamily: fonts.OutfitBold,
        fontSize: 16,
        color: colors.secondary
    },
    label: {
        marginBottom: 5,
        fontFamily: fonts.OutfitSemiBold,
        fontSize: 15,
        color: colors.black,
    },
    primaryColorText: {
        color: colors.primary
    }
});
