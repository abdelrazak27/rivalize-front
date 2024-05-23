import React from 'react';
import colors from '../styles/colors';
import { View } from 'react-native';

const Spacer = ({ top = 25, bottom = 25 }) => {
    return (
        <View style={{ paddingTop: top, paddingBottom: bottom, justifyContent: 'center' }}>
            <View style={{ height: 1, backgroundColor: colors.lightgrey }} />
        </View>
    );
};

export default Spacer;
