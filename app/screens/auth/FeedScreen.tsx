import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    SafeAreaView,
} from "react-native";
import { COLORS, FONTS, IMAGES, SIZES } from '../../constants/theme';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Dimensions } from "react-native";
 
type Language = {
    code: string;
    name: string;
    flag: string;
};
 
const languages: Language[] = [
    { code: "en", name: "English", flag: "https://flagcdn.com/w40/us.png" },
    { code: "ta", name: "Tamil", flag: "https://flagcdn.com/w40/in.png" },
    { code: "ml", name: "Malayalam", flag: "https://flagcdn.com/w40/in.png" },
    { code: "te", name: "Telugu", flag: "https://flagcdn.com/w40/in.png" },
    { code: "hi", name: "Hindi", flag: "https://flagcdn.com/w40/in.png" },
];
 
const { width, height } = Dimensions.get("window");
 
const FeedScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [selectedLang, setSelectedLang] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
 
    useEffect(() => {
        const checkLanguage = async () => {
            const savedLang = await AsyncStorage.getItem("FeedLanguage");
            if (savedLang) {
                navigation.replace("LanguageScreen"); // ensure Home exists in your navigator
 
            } else {
                setLoading(false);
            }
        };
        checkLanguage();
    }, []);
 
   const handleNext = async () => {
    if (selectedLang) {
        try {
            // Save locally
            await AsyncStorage.setItem("FeedLanguage", selectedLang);
 
            // Get token (assuming you store it in AsyncStorage after login)
            const token = await AsyncStorage.getItem("userToken");
 
            // Send to backend
            const response = await fetch("http://192.168.1.17:5000/api/user/feed/language", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`, // auth middleware expects token
                },
                body: JSON.stringify({ feedLanguage: selectedLang }),
            });
 
            const data = await response.json();
            console.log("Feed language saved:", data);
 
            // Navigate after success
            navigation.navigate('gender');
        } catch (error) {
            console.error("Error saving feed language:", error);
        }
    }
};
 
 
    if (loading) return null;
 
    const renderLanguageItem = ({ item }: { item: Language }) => (
        <TouchableOpacity
            style={[
                styles.languageItem,
                selectedLang === item.code && styles.languageItemSelected,
            ]}
            onPress={() => setSelectedLang(item.code)}
        >
            <Image source={{ uri: item.flag }} style={styles.flag} />
            <Text style={styles.languageText}>{item.name}</Text>
            {selectedLang === item.code && (
                <Icon
                    name="check-circle"
                    size={28}
                    color="#6C63FF"
                    style={{ marginLeft: "auto" }}
                />
            )}
        </TouchableOpacity>
    );
 
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Image
                        style={{ width: 18, height: 18, tintColor: '#000' }}
                        source={IMAGES.arrowleft}
                    />
                </TouchableOpacity>
 
                <Text style={styles.title}>Choose Your Feed Language</Text>
            </View>
 
            <FlatList
                data={languages}
                keyExtractor={(item) => item.code}
                renderItem={renderLanguageItem}
                contentContainerStyle={{ paddingVertical: 30 }}
            />
 
            {/* Next Button */}
            <TouchableOpacity
                style={[styles.nextButton, { opacity: selectedLang ? 1 : 0.5 }]}
                onPress={handleNext}
                disabled={!selectedLang}
            >
                <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};
 
export default FeedScreen;
 
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: width * 0.05, // instead of 20
        justifyContent: "flex-start",
        paddingTop: height * 0.1, // instead of 80
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#222",
 
    },
    languageItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 19, // increased padding
        paddingHorizontal: 20, // increased padding
        backgroundColor: "#f9f9f9",
        borderRadius: 14,
        marginVertical: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    languageItemSelected: {
        borderWidth: 2,
        borderColor: "#6C63FF",
        backgroundColor: "#f1f0ff",
    },
    flag: {
        width: 36,
        height: 24,
        borderRadius: 4,
        marginRight: 15,
    },
    languageText: {
        fontSize: 18,
        fontWeight: "500",
        color: "#333",
    },
    nextButton: {
        backgroundColor: "#6C63FF",
        paddingVertical: 16, // keep original size
        borderRadius: 14,
        alignItems: "center",
        alignSelf: "stretch",
        marginTop: 20, // reduce margin from bottom so it moves higher
        position: "absolute",
        bottom: height * 0.08, // instead of 60
        left: 20,
        right: 20,
    },
 
    nextButtonText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#fff",
    },
});
 
 