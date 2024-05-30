import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { CommonActions, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignUpScreen from './screens/SignUpScreen/SignUpScreen';
import SignUpComplete from './screens/SignUpScreen/SignUpComplete';
import HomeScreen from './screens/HomeScreen/HomeScreen';
import ConnexionScreen from './screens/ConnexionScreen/ConnexionScreen';
import { UserProvider, useUser } from './context/UserContext';
import CreateTeamScreen from './screens/CreateTeamScreen/CreateTeamScreen';
import InviteFirstPlayers from './screens/CreateTeamScreen/InviteFirstPlayers';
import TeamScreen from './screens/TeamScreen/TeamScreen';
import InvitationDetailScreen from './screens/InvitationDetailScreen/InvitationDetailScreen';
import ProfileScreen from './screens/ProfileScreen/ProfileScreen';
import EditTeamScreen from './screens/TeamScreen/EditTeamScreen';
import TournamentsScreen from './screens/TournamentScreen/TournamentsScreen';
import TeamsScreen from './screens/TeamScreen/TeamsScreen';
import UsersScreen from './screens/UsersScreen/UsersScreen';
import TournamentDetailScreen from './screens/TournamentScreen/TournamentDetailScreen';
import RequestJoinTeamDetailScreen from './screens/RequestJoinTeamDetailScreen/RequestJoinTeamDetailScreen';
import MatchDetailsScreen from './screens/MatchDetailsScreen/MatchDetailsScreen';
import LandingScreen from './screens/LandingScreen/LandingScreen';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import SquareButtonIcon from './components/SquareButtonIcon';

// icônes
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import NotificationsButton from './components/NotificationsButton';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { ChatModalProvider, useChatModal } from './context/ChatModalContext';
import ChatModal from './components/ChatModal';
import { LoadingProvider, useLoading } from './context/LoadingContext';
import LoadingOverlay from './components/LoadingOverlay';
import CreateTournamentFormScreen from './screens/TournamentScreen/CreateTournamentFormScreen';

const Stack = createStackNavigator();

function App() {
  const { user, setUser } = useUser();
  const { isChatModalVisible, tournamentId, closeChatModal } = useChatModal();
  const { isLoading } = useLoading();

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <KeyboardAwareScrollView
          resetScrollToCoords={{ x: 0, y: 0 }}
          contentContainerStyle={{ flexGrow: 1 }}
          scrollEnabled={false}
        >
          <Stack.Navigator
            initialRouteName="LandingScreen"
            screenOptions={({ navigation, route }) => ({
              headerLeft: () => (
                <SquareButtonIcon
                  onPress={() => navigation.goBack()}
                  IconComponent={AntDesign}
                  iconName="arrowleft"
                />
              ),
              headerRight: () => (
                user && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <SquareButtonIcon
                      onPress={() => navigation.navigate('ProfileScreen', { userId: user.uid })}
                      IconComponent={Feather}
                      iconName="user"
                      iconSize={30}
                      isFocused={route.name === 'ProfileScreen' && route.params?.userId === user.uid}
                    />
                    <NotificationsButton userId={user.uid} />
                    <SquareButtonIcon
                      onPress={async () => {
                        try {
                          Alert.alert(
                            "Déconnexion",
                            "Êtes-vous sûr de vouloir vous déconnecter ?",
                            [
                              {
                                text: "Annuler",
                                onPress: () => { },
                                style: "cancel"
                              },
                              {
                                text: "Déconnexion",
                                onPress: async () => {
                                  navigation.dispatch(
                                    CommonActions.reset({
                                      index: 0,
                                      routes: [{ name: 'ConnexionScreen' }],
                                    })
                                  );
                                  await setUser(null);
                                  await signOut(auth);
                                },
                                style: "destructive"
                              }
                            ]
                          );
                        } catch (error) {
                          console.log(error);
                          Alert.alert("Erreur", "Une erreur est survenue lors de la déconnexion.");
                        }
                      }}
                      IconComponent={MaterialCommunityIcons}
                      iconName="login-variant"
                      iconSize={30}
                    />
                  </View>
                )
              ),
              headerTitle: '',
              headerStyle: {
                backgroundColor: 'white',
                height: 120,
                elevation: 0,
                shadowOpacity: 0,
              },
              headerLeftContainerStyle: {
                paddingLeft: 30,
                paddingTop: 40,
              },
              headerRightContainerStyle: {
                paddingRight: 30,
                paddingTop: 40,
              },
              cardStyle: { backgroundColor: 'white' },
            })}
          >
            <Stack.Screen name="LandingScreen" component={LandingScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="ConnexionScreen"
              component={ConnexionScreen}
              options={{
                headerLeft: null,
                animationEnabled: false,
              }}
            />
            <Stack.Screen
              name="HomeScreen"
              component={HomeScreen}
              options={({ route }) => ({
                headerLeft: null,
                animationEnabled: route.params && route.params.noAnimation ? false : true,
              })}
            />
            <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
            <Stack.Screen name="SignUpComplete" component={SignUpComplete} options={{ headerLeft: null, headerRight: null }} />
            <Stack.Screen name="CreateTeamScreen" component={CreateTeamScreen} />
            <Stack.Screen name="InviteFirstPlayer" component={InviteFirstPlayers} options={{ headerLeft: null }} />
            <Stack.Screen name="TeamScreen" component={TeamScreen} />
            <Stack.Screen name="EditTeamScreen" component={EditTeamScreen} />
            <Stack.Screen name="InvitationDetailScreen" component={InvitationDetailScreen} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="TournamentsScreen" component={TournamentsScreen} />
            <Stack.Screen name="TournamentDetailScreen" component={TournamentDetailScreen} />
            <Stack.Screen name="CreateTournamentFormScreen" component={CreateTournamentFormScreen} />
            <Stack.Screen name="TeamsScreen" component={TeamsScreen} />
            <Stack.Screen name="RequestJoinTeamDetailScreen" component={RequestJoinTeamDetailScreen} />
            <Stack.Screen name="UsersScreen" component={UsersScreen} />
            <Stack.Screen name="MatchDetailsScreen" component={MatchDetailsScreen} />
          </Stack.Navigator>
        </KeyboardAwareScrollView>
      </NavigationContainer>
      <ChatModal visible={isChatModalVisible} onClose={closeChatModal} tournamentId={tournamentId} />
      <LoadingOverlay visible={isLoading} />
    </View>
  );
}

export default function MainApp() {
  return (
    <UserProvider>
      <ChatModalProvider>
        <LoadingProvider>
          <App />
        </LoadingProvider>
      </ChatModalProvider>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
