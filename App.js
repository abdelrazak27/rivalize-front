import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignUpScreen from './screens/SignUpScreen/SignUpScreen';
import SignInScreen from './screens/SignInScreen/SignInScreen';
import SignUpComplete from './screens/SignUpScreen/SignUpComplete';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <View style={styles.container}>
        <Stack.Navigator initialRouteName="SignUpScreen">
          {/* <Stack.Screen name="Home" component={HomeScreen} /> */}
          <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
          <Stack.Screen name="SignInScreen" component={SignInScreen} />
          <Stack.Screen name="SignUpComplete" component={SignUpComplete} />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});
