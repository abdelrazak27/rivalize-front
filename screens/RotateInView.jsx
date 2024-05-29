import React, { useState, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

const RotateInView = (props) => {
    const [rotateAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.loop(
            Animated.timing(
                rotateAnim,
                {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true
                }
            )
        ).start();
    }, []);

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const animatedStyle = {
        transform: [{
            rotate: rotateInterpolate
        }]
    };

    return (
        <Animated.View
            style={{
                ...props.style,
                ...animatedStyle
            }}
        >
            {props.children}
        </Animated.View>
    );
};

export default RotateInView;
