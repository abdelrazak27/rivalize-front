import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';

export const useAppFonts = () => {
    return useFonts({
        Outfit_400Regular,
        Outfit_600SemiBold,
        Outfit_700Bold,
    });
};

export const fonts = {
    regular: 'Outfit_400Regular',
    semiBold: 'Outfit_600SemiBold',
    bold: 'Outfit_700Bold',
};
