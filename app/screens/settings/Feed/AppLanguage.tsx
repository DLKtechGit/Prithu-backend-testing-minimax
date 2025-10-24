import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Language = {
  code: string;
  name: string;
  flag: string;
};

// ✅ Initial 5 Languages
const firstLanguages: Language[] = [
  { code: "ta", name: "Tamil", flag: "http://flagcdn.com/w40/in.png" },
  { code: "en", name: "English", flag: "http://flagcdn.com/w40/us.png" },
  { code: "ml", name: "Malayalam", flag: "http://flagcdn.com/w40/in.png" },
  { code: "hi", name: "Hindi", flag: "http://flagcdn.com/w40/in.png" },
  { code: "te", name: "Telugu", flag: "http://flagcdn.com/w40/in.png" },
];

// ✅ Full Language List
const allLanguages: Language[] = [
  ...firstLanguages,
  { code: "kn", name: "Kannada", flag: "http://flagcdn.com/w40/in.png" },
  { code: "mr", name: "Marathi", flag: "http://flagcdn.com/w40/in.png" },
  { code: "es", name: "Spanish", flag: "http://flagcdn.com/w40/es.png" },
  { code: "de", name: "German", flag: "http://flagcdn.com/w40/de.png" },
  { code: "it", name: "Italian", flag: "http://flagcdn.com/w40/it.png" },
];

const AppLanguage: React.FC = () => {
  const navigation = useNavigation();
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [recentLang, setRecentLang] = useState<Language | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 🔹 Fetch language from backend first
  useEffect(() => {
    const fetchAppLanguage = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken"); // 🔐 assuming user token saved
        const res = await fetch("http://192.168.1.10:5000/api/user/get/app/language", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok && data?.data?.appLanguageCode) {
          const backendCode = data.data.appLanguageCode;
          const langObj = allLanguages.find((l) => l.code === backendCode);
          if (langObj) {
            setRecentLang(langObj);
            setSelectedLang(langObj.code);
            await AsyncStorage.setItem("AppLanguage", langObj.code); // 🔸 Keep local sync
          }
        } else {
          // fallback: load from AsyncStorage if backend doesn’t have one
          const savedLang = await AsyncStorage.getItem("AppLanguage");
          if (savedLang) {
            const langObj = allLanguages.find((l) => l.code === savedLang);
            if (langObj) {
              setRecentLang(langObj);
              setSelectedLang(langObj.code);
            }
          }
        }
      } catch (error) {
        console.log("Error fetching app language:", error);
        Alert.alert("Error", "Failed to load app language.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppLanguage();
  }, []);

  // 🔹 Handle language selection
  const handleSelectLanguage = async (lang: Language) => {
    try {
      setSelectedLang(lang.code);
      setRecentLang(lang);
      await AsyncStorage.setItem("AppLanguage", lang.code);

      const token = await AsyncStorage.getItem("userToken");
      // ✅ Send update to backend
      await fetch("http://192.168.1.10:5000/api/user/app/language", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appLanguageCode: lang.code,
          appNativeCode: lang.name,
          appLanguage: lang.code,  
        }),
      });

      console.log("Selected Language:", lang.name);
    } catch (err) {
      console.log("Error saving language:", err);
      Alert.alert("Error", "Could not update language. Please try again.");
    }
  };

  // 🔹 Render language item
  const renderLanguageItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={styles.languageItem}
      onPress={() => handleSelectLanguage(item)}
    >
      <Image source={{ uri: item.flag }} style={styles.flag} />
      <Text style={styles.languageText}>{item.name}</Text>
      {selectedLang === item.code ? (
        <Icon name="check-circle" size={22} color="#6C63FF" style={{ marginLeft: "auto" }} />
      ) : null}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="arrow-left" size={24} color="#000" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>App Language</Text>
      </View>

      {!recentLang ? (
        <>
          <Text style={styles.sectionTitle}>Choose Your Language</Text>
          <FlatList
            data={firstLanguages}
            keyExtractor={(item) => item.code}
            renderItem={renderLanguageItem}
          />
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Recent Language</Text>
          <View>{recentLang && renderLanguageItem({ item: recentLang })}</View>

          <Text style={styles.sectionTitle}>All Languages</Text>
          <FlatList
            data={allLanguages}
            keyExtractor={(item) => item.code}
            renderItem={renderLanguageItem}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default AppLanguage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 10,
    marginBottom: 5,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    borderRadius: 8,
  },
  flag: {
    width: 28,
    height: 20,
    borderRadius: 3,
    marginRight: 12,
  },
  languageText: {
    fontSize: 16,
    color: "#222",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
