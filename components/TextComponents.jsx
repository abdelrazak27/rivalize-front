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
});
