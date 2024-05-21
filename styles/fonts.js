import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';

export const useAppFonts = () => {
    return useFonts({
        Outfit_400Regular,
        Outfit_600SemiBold,
        Outfit_700Bold,
    });
};

export const fonts = {
    OutfitRegular: 'Outfit_400Regular',
    OutfitSemiBold: 'Outfit_600SemiBold',
    OutfitBold: 'Outfit_700Bold',
};
