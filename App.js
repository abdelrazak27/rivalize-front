import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
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
import TournamentsScreen from './screens/TournamentsScreen';
import TeamsScreen from './screens/TeamsScreen';
import UsersScreen from './screens/UsersScreen';
import CreateTournamentFormScreen from './screens/CreateTournamentFormScreen';
// import EditTournamentFormScreen from './screens/EditTournamentFormScreen';
import TournamentDetailScreen from './screens/TournamentDetailScreen';
import RequestJoinTeamDetailScreen from './screens/RequestJoinTeamDetailScreen';
import MatchDetailsScreen from './screens/MatchDetailsScreen';
import ChatScreen from './screens/ChatScreen';
import LandingScreen from './screens/LandingScreen';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import SquareButtonIcon from './components/SquareButtonIcon';

// icônes
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createStackNavigator();

function App() {
  const { user } = useUser();
  console.log(user);

  return (
    <NavigationContainer>
      <KeyboardAwareScrollView
        resetScrollToCoords={{ x: 0, y: 0 }}
        contentContainerStyle={{ flexGrow: 1 }}
        scrollEnabled={false}
      >
        <Stack.Navigator
          initialRouteName="LandingScreen"
          screenOptions={({ navigation }) => ({
            headerLeft: () => (
              <SquareButtonIcon
                onPress={() => navigation.goBack()}
                IconComponent={AntDesign}
                iconName="arrowleft"
                iconColor="#000"
              />
            ),
            headerRight: () => (
              user && (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SquareButtonIcon
                    onPress={() => { console.log('Profile'); }}
                    IconComponent={Feather}
                    iconName="user"
                    iconColor="#000"
                    iconSize={30}
                  />
                  <SquareButtonIcon
                    onPress={() => { console.log('Notifications'); }}
                    IconComponent={Ionicons}
                    iconName="notifications"
                    iconColor="#000"
                    iconSize={30}
                  />
                  <SquareButtonIcon
                    onPress={() => { console.log('disconnect'); }}
                    IconComponent={MaterialCommunityIcons}
                    iconName="login-variant"
                    iconColor="#000"
                    iconSize={30}
                  />
                </View>
              )
            ),
            headerTitle: '',
            headerStyle: {
              backgroundColor: 'white',
              height: 200,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerLeftContainerStyle: {
              paddingLeft: 30,
            },
            headerRightContainerStyle: {
              paddingRight: 30,
            },
            cardStyle: { backgroundColor: 'white' },
          })}
        >
          <Stack.Screen name="LandingScreen" component={LandingScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="ConnexionScreen"
            component={ConnexionScreen}
            options={{
              headerShown: false,
              animationEnabled: false,
            }}
          />
          <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerLeft: null }} />
          <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
          <Stack.Screen name="SignUpComplete" component={SignUpComplete} options={{ headerLeft: null }} />
          <Stack.Screen name="CreateTeamScreen" component={CreateTeamScreen} />
          <Stack.Screen name="InviteFirstPlayer" component={InviteFirstPlayers} options={{ headerLeft: null }} />
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
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
        </Stack.Navigator>
      </KeyboardAwareScrollView>
    </NavigationContainer>
  );
}

export default function MainApp() {
  return (
    <UserProvider>
      <App />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
