import { useState } from 'react';
import SignUpStepOne from './SignUpStepOne';
import SignUpStepTwo from './SignUpStepTwo';
import SignUpStepThree from './SignUpStepThree';
import { SignUpProvider } from '../../context/SignUpContext';

const StepComponents = [SignUpStepOne, SignUpStepTwo, SignUpStepThree];

const SignUpScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const goToNextStep = () => setCurrentStep((prevStep) => prevStep + 1);
  const goToPreviousStep = () => setCurrentStep((prevStep) => prevStep - 1);

  const CurrentStepComponent = StepComponents[currentStep];

  return (
    <SignUpProvider>
      <CurrentStepComponent onPrevious={goToPreviousStep} onNext={goToNextStep} />
    </SignUpProvider>
  );
};

export default SignUpScreen;
