import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import ChatScreen from '../screens/ChatScreen';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SquareButtonIcon from './SquareButtonIcon';
import colors from '../styles/colors';


const ChatModalContent = ({ onClose, tournamentId }) => {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={[styles.modalView]}>
            <View style={styles.header}>
                <SquareButtonIcon
                    onPress={onClose}
                    IconComponent={AntDesign}
                    iconName="arrowleft"
                />
            </View>
            {tournamentId && (
                <ChatScreen route={{ params: { tournamentId } }} />
            )}
        </SafeAreaView>
    );
};

const ChatModal = ({ visible, onClose, tournamentId }) => {
    return (
        <Modal
            animationType="fade"
            transparent={false} 
            visible={visible}
            onRequestClose={onClose}
        >
            <SafeAreaProvider>
                <ChatModalContent onClose={onClose} tournamentId={tournamentId} />
            </SafeAreaProvider>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalView: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        backgroundColor: 'white',
        paddingHorizontal: 30,
    },
    header: {
        alignItems: 'flex-start',
        paddingTop: 28,
        paddingBottom: 15,
        borderBottomColor: colors.lightgrey,
        borderBottomWidth: 1,
    },
});

export default ChatModal;
