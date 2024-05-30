import React, { useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useAppFonts, fonts } from '../../styles/fonts';
import colors from '../../styles/colors';

function LandingScreen({ navigation }) {
    let [fontsLoaded] = useAppFonts();
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const displayTimer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 1000, 
                useNativeDriver: true,
            }).start(() => {
                
                navigation.replace('ConnexionScreen');
            });
        }, 2000); 

        return () => {
            clearTimeout(displayTimer);
            fadeAnim.stopAnimation();
        };
    }, [navigation, fadeAnim]);

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Text style={styles.text}>rivalize.</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    text: {
        color: colors.primary,
        fontFamily: fonts.OutfitBold,
        fontSize: 50,
    },
});

export default LandingScreen;
