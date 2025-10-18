// import React, { useState } from 'react';
// import { View, Text, Switch } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { COLORS } from '../../../constants/theme';
// import Header from '../../../layout/Header';
// import { GlobalStyleSheet } from '../../../constants/styleSheet';
// import { useTheme } from '@react-navigation/native';

// const SettingNotification = () => {
//   const [isEnabled, setIsEnabled] = useState(false);
//   const toggleSwitch = () => setIsEnabled(previousState => !previousState);

//    const theme = useTheme();
//     const { colors } : {colors : any} = theme;

//   return (
//     <SafeAreaView style={{ backgroundColor: colors.card, flex: 1 }}>
//       <Header
//         title='Contacts syncing'
//       />
//       <View style={GlobalStyleSheet.container}>
//         <View style={[GlobalStyleSheet.flexalingjust, { marginTop: 20 }]}>
//           <Text style={[GlobalStyleSheet.textfont, { fontSize: 15,color:colors.title }]}>Connect contacts</Text>
//           <Switch
//             trackColor={{ false: '#767577', true: 'rgba(41,121,248,.2)' }}
//             thumbColor={isEnabled ? '#2979F8' : '#f4f3f4'}
//             ios_backgroundColor="#3e3e3e"
//             onValueChange={toggleSwitch}
//             value={isEnabled}
//           />
//         </View>
//       </View>
//     </SafeAreaView>
//   )
// }

// export default SettingNotification;



// import React, { useEffect, useRef } from "react";
// import { View, Text, Animated, StyleSheet, SafeAreaView } from "react-native";
// import { useTheme } from "@react-navigation/native";
// import Header from "../../../layout/Header"; // same Header you used in SettingNotification
// import { GlobalStyleSheet } from "../../../constants/styleSheet";

// const DUMMY_TAGS = [
//   "Tech", "Music", "Fashion", "Sports", "Travel",
//   "Food", "Movies", "Gaming", "Health", "Finance",
//   "Art", "Science", "Books", "Nature"
// ];

// const FeedCategoryFloating = () => {
//   const animations = useRef(DUMMY_TAGS.map(() => new Animated.Value(1))).current;
//   const theme = useTheme();
//   const { colors }: { colors: any } = theme;

//   // 🌬️ Gentle “breathing” animation for floating illusion
//   useEffect(() => {
//     animations.forEach((anim, index) => {
//       const pulse = () => {
//         Animated.sequence([
//           Animated.timing(anim, {
//             toValue: 1.07,
//             duration: 2500 + index * 100,
//             useNativeDriver: true,
//           }),
//           Animated.timing(anim, {
//             toValue: 1,
//             duration: 2500 + index * 100,
//             useNativeDriver: true,
//           }),
//         ]).start(() => pulse());
//       };
//       pulse();
//     });
//   }, []);

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
//       {/* 🔹 Reuse Header from your layout */}
//       <Header title="Feed Categories" />

//       <View style={[GlobalStyleSheet.container, { marginTop: 20 }]}>
//         <Text style={[styles.title, { color: colors.title }]}>
//           Choose Your Favorite Categories
//         </Text>
// <View style={styles.tagsContainer}>
//   {DUMMY_TAGS.map((tag, index) => (
//     <View
//       key={index}
//       style={[
//         styles.shadowWrapper,
//         { shadowColor: colors.title, shadowOpacity: 0.15 + (index % 3) * 0.1 },
//       ]}
//     >
//       <Animated.View
//         style={[
//           styles.tag,
//           {
//             backgroundColor: "white",
//             transform: [{ scale: animations[index] }],
//           },
//         ]}
//       >
//         <Text style={[styles.tagText, { color: colors.title }]}>{tag}</Text>
//       </Animated.View>
//     </View>
//   ))}
// </View>

//       </View>
//     </SafeAreaView>
//   );
// };

// export default FeedCategoryFloating;

// const styles = StyleSheet.create({
//   title: {
//     fontSize: 18, // slightly bigger
//     fontWeight: "600",
//     marginBottom: 20,
//     textAlign: "center",
//   },
//    tagsContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   shadowWrapper: {
//     borderRadius: 20,
//     margin: 6,
//     elevation: 9, // Android shadow
//     shadowOffset: { width: 0, height: 3 }, // iOS shadow
//     shadowRadius: 5,
//     backgroundColor: "transparent", // important so shadow shows but container is invisible
//   },
//   tag: {
//     borderRadius: 20,
//     paddingHorizontal: 24,
//     paddingVertical: 15,
//     flexShrink: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   tagText: {
//     fontSize: 16,
//     fontWeight: "500",
//   },
// });


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
import { useTheme } from "@react-navigation/native";
import Header from "../../../layout/Header";
import { GlobalStyleSheet } from "../../../constants/styleSheet";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FeedCategoryFloating = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const theme = useTheme();
  const { colors } = theme;
  const animations = useRef([]).current;
  const alertAnim = useRef(new Animated.Value(-60)).current; // start above screen

  // 🟣 Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://192.168.1.42:5000/api/get/feed/category");
        const data = await response.json();
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
          data.categories.forEach(() => animations.push(new Animated.Value(1)));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

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

  // 🟡 Show top alert animation
  const showAlert = (message) => {
    setAlertMessage(message);
    Animated.sequence([
      Animated.timing(alertAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(alertAnim, {
        toValue: -60,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 🟢 Handle Category Select (max 5)
  const toggleCategory = (categoryId) => {
    const alreadySelected = selectedCategories.includes(categoryId);
    if (alreadySelected) {
      // Unselect
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      // Select new
      if (selectedCategories.length >= 5) {
        showAlert("You can only select up to five categories");
        return;
      }
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.card,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      {/* 🟣 Top Alert Message */}
      <Animated.View
        style={[
          styles.alertContainer,
          {
            backgroundColor: "#ff4d4f",
            transform: [{ translateY: alertAnim }],
          },
        ]}
      >
        <Text style={styles.alertText}>{alertMessage}</Text>
      </Animated.View>

      <Header title="Feed Categories" />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[GlobalStyleSheet.container, { marginTop: 20 }]}>
          {/* 🟣 Logo and App Name */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../../app/assets/images/icons/prithu.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.appName, { color: colors.title }]}>prithu</Text>
          </View>

          {/* 🟣 Heading */}
          <Text style={[styles.heading, { color: colors.title }]}>
            What type of categories you want choose?
          </Text>
          <Text style={[styles.subText, { color: colors.text }]}>
            Please select up to five categories.
          </Text>

          {/* 🟣 Categories */}
          <View style={styles.tagsContainer}>
            {categories.map((cat, index) => {
              const isSelected = selectedCategories.includes(cat.categoryId);
              return (
                <TouchableOpacity
                  key={cat.categoryId}
                  activeOpacity={0.7}
                  onPress={() => toggleCategory(cat.categoryId)}
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

        {/* 🟣 Continue Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: colors.primary }]}
    onPress={async () => {
    if (selectedCategories.length === 0) {
    showAlert("Please select at least one category");
    return;
  }

  try {
    // 👇 Get user token (or userId) from AsyncStorage
    const userData = await AsyncStorage.getItem("userToken");

    // 👇 Send all selected categories in a single request
    const response = await fetch("http://192.168.1.42:5000/api/user/intrested/category/begin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userData}`, // only if your backend uses token auth
      },
      body: JSON.stringify({
        userId: userData, // directly pass stored value if backend extracts from token
        categoryIds: selectedCategories, // 👈 send array here
      }),
    });

    const result = await response.json();
    console.log("✅ Categories saved:", result);

    if (response.ok) {
      navigation.navigate("DrawerNavigation", { screen: "Home" });
    } else {
      showAlert(result.message || "Something went wrong. Please try again.");
    }

  } catch (error) {
    console.error("Error saving categories:", error);
    showAlert("Something went wrong. Please try again.");
  }
}}

>
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FeedCategoryFloating;

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
  alertText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 6,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6,
  },
  subText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
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
    backgroundColor: "transparent",
  },
  tag: {
    borderRadius: 25,
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tagText: {
    fontSize: 15,
    fontWeight: "500",
  },
  bottomContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  continueBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
