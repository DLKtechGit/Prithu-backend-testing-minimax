// AppLanguage.tsx
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

// ✅ Full Language List (can extend later)
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

  // 🔹 Load stored language from AsyncStorage
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLang = await AsyncStorage.getItem("AppLanguage");
      if (savedLang) {
        const langObj = allLanguages.find((l) => l.code === savedLang);
        if (langObj) {
          setRecentLang(langObj);
          setSelectedLang(langObj.code);
        }
      }
    };
    loadLanguage();
  }, []);

  // 🔹 Handle language selection
  const handleSelectLanguage = async (lang: Language) => {
    setSelectedLang(lang.code);
    setRecentLang(lang);
    await AsyncStorage.setItem("AppLanguage", lang.code); // store in asyncstorage
    console.log("Selected Language:", lang.name);
  };

  // 🔹 Render each language item
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="arrow-left" size={24} color="#000" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>App Language</Text>
      </View>

      {/* First time: show only 5 languages */}
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
          {/* Recent Language */}
         <Text style={styles.sectionTitle}>Recent Language</Text>
         <View>
             {recentLang && renderLanguageItem({ item: recentLang })}
         </View>

          {/* All Languages */}
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
  paddingVertical: 16,   // 🔹 increased vertical padding
  paddingHorizontal: 10, // 🔹 added horizontal padding
  borderBottomWidth: 0.5,
  borderBottomColor: "#eee",
  borderRadius: 8,       // 🔹 smoother edges
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
});
