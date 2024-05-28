import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, Text } from 'react-native';
import ChatScreen from '../screens/ChatScreen';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SquareButtonIcon from './SquareButtonIcon';
import colors from '../styles/colors';
import { fonts } from '../styles/fonts';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';


const ChatModalContent = ({ onClose, tournamentId }) => {
    const insets = useSafeAreaInsets();
    const [tournamentName, setTournamentName] = useState('');

    useEffect(() => {
        const fetchTournamentName = async () => {
            const docRef = doc(db, 'tournois', tournamentId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setTournamentName(docSnap.data().name);
            } else {
                console.log('No such document!');
            }
        };

        if (tournamentId) {
            fetchTournamentName();
        }
    }, [tournamentId]);

    return (
        <SafeAreaView style={[styles.modalView]}>
            <View style={styles.header}>
                <SquareButtonIcon
                    onPress={onClose}
                    IconComponent={AntDesign}
                    iconName="arrowleft"
                />
                <Text style={styles.headerTitle}>{tournamentName}</Text>
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
        // paddingHorizontal: 30,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 28,
        paddingBottom: 15,
        borderBottomColor: colors.lightgrey,
        borderBottomWidth: 1,
        marginHorizontal: 30,
    },
    headerTitle:{
        color: colors.primary,
        fontFamily: fonts.OutfitBold,
        fontSize: 18,
        textTransform: 'uppercase',
    }
});

export default ChatModal;