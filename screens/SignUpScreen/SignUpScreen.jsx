import { useState } from 'react';
import SignUpStepOne from './SignUpStepOne';
import SignUpStepTwo from './SignUpStepTwo';
import SignUpStepThree from './SignUpStepThree';
import SignUpComplete from './SignUpComplete';
import { SignUpProvider } from '../../context/SignUpContext';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';

const StepComponents = [SignUpStepOne, SignUpStepTwo, SignUpStepThree, SignUpComplete];

const SignUpScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigation = useNavigation();

  const goToNextStep = () => setCurrentStep((prevStep) => prevStep + 1);
  const goToPreviousStep = () => setCurrentStep((prevStep) => prevStep - 1);

  const CurrentStepComponent = StepComponents[currentStep];

  const onSignUpSuccess = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'SignUpComplete' }],
      })
    );
  };

  return (
    <SignUpProvider>
      <CurrentStepComponent onPrevious={goToPreviousStep} onNext={goToNextStep} onSignUpSuccess={onSignUpSuccess} />
    </SignUpProvider>
  );
};

export default SignUpScreen;
