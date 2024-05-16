import { Button } from 'react-native';

const FunctionButton = ({ title, onPress, disabled }) => {
    return <Button title={title} onPress={onPress} disabled={disabled}/>;
};

export default FunctionButton;
