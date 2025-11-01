import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";
import Header from "../../layout/Header";
import { GlobalStyleSheet } from "../../constants/styleSheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from '../../../apiInterpretor/apiInterceptor';

const CategoriesScreen = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const theme = useTheme();
  const { colors } = theme;
  const animations = useRef([]).current;
  const alertAnim = useRef(new Animated.Value(-60)).current;
  const navigation = useNavigation();

  // 🟢 Check if user already selected categories before
  useEffect(() => {
    const checkSelected = async () => {
      const saved = await AsyncStorage.getItem("UserCategories");
      if (saved) {
        // skip this screen if already completed
        navigation.replace("gender");
      } else {
        fetchCategories();
      }
    };
    checkSelected();
  }, []);

  // 🟣 Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/get/feed/category");
      if (response.data.categories && response.data.categories.length > 0) {
        setCategories(response.data.categories);
        response.data.categories.forEach(() => animations.push(new Animated.Value(1)));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🌬️ Gentle pulse animation
  useEffect(() => {
    if (!animations.length) return;
    animations.forEach((anim, index) => {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1.07,
            duration: 2500 + index * 100,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2500 + index * 100,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();
    });
  }, [animations]);

  // 🟡 Show alert animation
  const showAlert = (message) => {
    setAlertMessage(message);
    Animated.sequence([
      Animated.timing(alertAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(alertAnim, { toValue: -60, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  // 🟣 Select Category (max 5)
  const toggleCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      if (selectedCategories.length >= 5) {
        showAlert("You can only select up to five categories");
        return;
      }
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  // 🟢 Continue (save to backend + navigate to Gender)
  const handleContinue = async () => {
    if (selectedCategories.length === 0) {
      showAlert("Please select at least one category");
      return;
    }

    try {
      const response = await api.post("/api/user/intrested/category/begin", {
        categoryIds: selectedCategories,
      });

      console.log("✅ Categories saved:", response.data);

      
      // Save locally so user won't see this again
      await AsyncStorage.setItem("UserCategories", JSON.stringify(selectedCategories));

      // Navigate to Gender screen with params
      navigation.navigate("gender", { selectedCategories });
    } catch (error) {
      console.error("Error saving categories:", error);
      showAlert("Something went wrong. Please try again.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      {/* 🔴 Alert */}
      <Animated.View
        style={[
          styles.alertContainer,
          { backgroundColor: "#ff4d4f", transform: [{ translateY: alertAnim }] },
        ]}
      >
        <Text style={styles.alertText}>{alertMessage}</Text>
      </Animated.View>

      <Header title="Feed Categories" />

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}>
        <View style={[GlobalStyleSheet.container, { marginTop: 20 }]}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../app/assets/images/icons/prithu.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.appName, { color: colors.title }]}>prithu</Text>
          </View>

          <Text style={[styles.heading, { color: colors.title }]}>
            What type of categories you want to choose?
          </Text>
          <Text style={[styles.subText, { color: colors.text }]}>
            Please select up to five categories.
          </Text>

          <View style={styles.tagsContainer}>
            {categories.map((cat, index) => {
              const isSelected = selectedCategories.includes(cat.categoryId);
              return (
                <TouchableOpacity
                  key={cat.categoryId}
                  onPress={() => toggleCategory(cat.categoryId)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.shadowWrapper,
                      { shadowColor: colors.title, shadowOpacity: 0.15 + (index % 3) * 0.1 },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.tag,
                        {
                          backgroundColor: isSelected ? colors.primary : "#fff",
                          transform: [{ scale: animations[index] }],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          { color: isSelected ? "#fff" : colors.title },
                        ]}
                      >
                        {cat.categoryName}
                      </Text>
                    </Animated.View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoriesScreen;

const styles = StyleSheet.create({
  alertContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  alertText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  logoContainer: { alignItems: "center", marginBottom: 30 },
  logo: { width: 60, height: 60, marginBottom: 6 },
  appName: { fontSize: 20, fontWeight: "700", textTransform: "capitalize" },
  heading: { fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 6 },
  subText: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  shadowWrapper: {
    borderRadius: 25,
    margin: 6,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  tag: {
    borderRadius: 25,
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tagText: { fontSize: 15, fontWeight: "500" },
  bottomContainer: { alignItems: "center", paddingHorizontal: 20, marginBottom: 35 },
  continueBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
