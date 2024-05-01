import React from 'react';
import { Text, View } from 'react-native';

function ProfileScreen({ route }) {
    const { userId } = route.params;

    return (
        <View>
            {userId ? (
                <>
                    <Text>ProfileScreen</Text>
                    <Text>userId: {userId}</Text>
                </>
            ) : (
                <Text>Chargement...</Text>
            )}
        </View>
    );
}

export default ProfileScreen;
