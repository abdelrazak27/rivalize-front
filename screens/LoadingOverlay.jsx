import React from 'react';
import { View, StyleSheet, Modal, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RotateInView from './RotateInView'; 
import colors from '../styles/colors';

const LoadingOverlay = ({ visible }) => {
    return (
        <Modal
            transparent={true}
            animationType="none"
            visible={visible}
            onRequestClose={() => { }}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <RotateInView>
                        <Ionicons name="football" size={80} color={colors.primary} />
                    </RotateInView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.verylightgrey,
    },
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10
    },
});

export default LoadingOverlay;
