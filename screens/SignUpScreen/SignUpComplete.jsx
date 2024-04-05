import { Text, View } from "react-native"
import styles from './styles';

function SignUpComplete() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>STEP COMPLETED: Inscription réussie</Text>
        </View>
    )
}

export default SignUpComplete;