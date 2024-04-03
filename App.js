import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import SignUp from './components/Signup/Signup';
import SignIn from './components/Signin/Signin';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>APP.JS</Text>
      <StatusBar style="auto" />
      <SignUp />
      {/* <SignIn /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
