import { SafeAreaView, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignUpScreen from './screens/SignUpScreen/SignUpScreen';
import SignInScreen from './screens/SignInScreen/SignInScreen';
import SignUpComplete from './screens/SignUpScreen/SignUpComplete';
import HomeScreen from './screens/HomeScreen/HomeScreen';
import ConnexionScreen from './screens/ConnexionScreen/ConnexionScreen';
import { UserProvider } from './context/UserContext';
import CreateTeamScreen from './screens/CreateTeamScreen/CreateTeamScreen';
import InviteFirstPlayers from './screens/CreateTeamScreen/InviteFirstPlayers';
import TeamScreen from './screens/TeamScreen/TeamScreen';
import InvitationDetailScreen from './screens/InvitationDetailScreen/InvitationDetailScreen';
import ProfileScreen from './screens/ProfileScreen/ProfileScreen';
import EditTeamScreen from './screens/TeamScreen/EditTeamScreen';
import TournamentsScreen from './screens/TournamentsScreen';
import TeamsScreen from './screens/TeamsScreen';
import UsersScreen from './screens/UsersScreen';
import CreateTournamentFormScreen from './screens/CreateTournamentFormScreen';
import EditTournamentFormScreen from './screens/EditTournamentFormScreen';
import TournamentDetailScreen from './screens/TournamentDetailScreen';
import RequestJoinTeamDetailScreen from './screens/RequestJoinTeamDetailScreen';
import MatchDetailsScreen from './screens/MatchDetailsScreen';

const Stack = createStackNavigator();

export default function App() {

  return (
    <UserProvider>
      <NavigationContainer>
        <SafeAreaView style={styles.container}>
          <Stack.Navigator
            initialRouteName="ConnexionScreen"
            screenOptions={{
              headerTitle: '',
              headerStyle: {
                backgroundColor: 'transparent',
                height: 50,
                elevation: 0,
                shadowOpacity: 0,
              },
              headerLeftContainerStyle: {
                paddingLeft: 10,
              },
              headerRightContainerStyle: {
                paddingRight: 10,
              }
            }}>
            <Stack.Screen name="ConnexionScreen" component={ConnexionScreen} />
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
            <Stack.Screen name="SignInScreen" component={SignInScreen} />
            <Stack.Screen name="SignUpComplete" component={SignUpComplete} />
            <Stack.Screen name="CreateTeamScreen" component={CreateTeamScreen} />
            <Stack.Screen name="InviteFirstPlayer" component={InviteFirstPlayers} />
            <Stack.Screen name="TeamScreen" component={TeamScreen} />
            <Stack.Screen name="EditTeamScreen" component={EditTeamScreen} />
            <Stack.Screen name="InvitationDetailScreen" component={InvitationDetailScreen} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="TournamentsScreen" component={TournamentsScreen} />
            <Stack.Screen name="TournamentDetailScreen" component={TournamentDetailScreen} />
            <Stack.Screen name="CreateTournamentFormScreen" component={CreateTournamentFormScreen} />
            {/* <Stack.Screen name="EditTournamentFormScreen" component={EditTournamentFormScreen} /> */}
            <Stack.Screen name="TeamsScreen" component={TeamsScreen} />
            <Stack.Screen name="RequestJoinTeamDetailScreen" component={RequestJoinTeamDetailScreen} />
            <Stack.Screen name="UsersScreen" component={UsersScreen} />
            <Stack.Screen name="MatchDetailsScreen" component={MatchDetailsScreen} />
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </UserProvider>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "pink"
  },
});
