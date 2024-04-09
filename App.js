import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignUpScreen from './screens/SignUpScreen/SignUpScreen';
import SignInScreen from './screens/SignInScreen/SignInScreen';
import SignUpComplete from './screens/SignUpScreen/SignUpComplete';
import HomeScreen from './screens/HomeScreen/HomeScreen';
import ConnexionScreen from './screens/ConnexionScreen/ConnexionScreen';
import { UserProvider } from './context/UserContext';
import CreateTeamScreen from './screens/CreateTeamScreen/CreateTeamScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <UserProvider>
      <NavigationContainer>
        <View style={styles.container}>
          <Stack.Navigator initialRouteName="CreateTeamScreen">
            <Stack.Screen name="ConnexionScreen" component={ConnexionScreen} />
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
            <Stack.Screen name="SignInScreen" component={SignInScreen} />
            <Stack.Screen name="SignUpComplete" component={SignUpComplete} />
            <Stack.Screen name="CreateTeamScreen" component={CreateTeamScreen} />
          </Stack.Navigator>
        </View>
      </NavigationContainer>
    </UserProvider>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});
