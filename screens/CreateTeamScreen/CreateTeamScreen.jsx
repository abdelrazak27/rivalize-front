import { View } from 'react-native'
import { useUser } from '../../context/UserContext';
import CreateTeamForm from './CreateTeamForm';

function CreateTeamScreen() {

    const { user } = useUser();

    return (
        <View>
            <CreateTeamForm user={user} />
        </View>
    )
}

export default CreateTeamScreen;