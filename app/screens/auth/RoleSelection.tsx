import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import api from "../../../apiInterpretor/apiInterceptor";

const RoleSelectionScreen: React.FC = () => {
  const [role, setRole] = useState<"Creator" | "User" | null>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
 
  const handleSave = async () => {
    if (!role) return;
 
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        alert("User not authenticated, please login again");
        return;
      }
 
      // If Creator → hit API
      if (role === "Creator") {
        setLoading(true);
        try {
          const response = await api.post(
            "/api/account/add",
            { type: "Creator" }
          );
 
          if (response.status === 201) {
            // store new token if returned
            if (response.data.token) {
              
              await AsyncStorage.setItem("userToken", response.data.token);
            }
            navigation.navigate("DrawerNavigation", { screen: "Home" });
          } else {
            alert("Could not create creator account.");
          }
        } catch (err: any) {
          console.error("Switch Account Error:", err.message);
          alert(
            err?.response?.data?.message ||
              "Error creating creator account. Please try again."
          );
        } finally {
          setLoading(false);
        }
      } else {
        // If User → just navigate home without API
        navigation.navigate("DrawerNavigation", { screen: "Home" });
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };
 
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Choose Your Account Type</Text>
      <Text style={styles.subText}>
        We’ll personalize the experience depending on whether you’re a creator
        or a user.
      </Text>
 
      <View style={styles.optionContainer}>
        <TouchableOpacity
          style={[styles.optionCard, role === "Creator" && styles.selectedCard]}
          onPress={() => setRole("Creator")}
        >
          <Text style={styles.optionText}>Creator</Text>
          <Image
            source={require("../../assets/images/icons/Creator.png")}
            style={styles.icon}
          />
        </TouchableOpacity>
 
        <TouchableOpacity
          style={[styles.optionCard, role === "User" && styles.selectedCard]}
          onPress={() => setRole("User")}
        >
          <Text style={styles.optionText}>User</Text>
          <Image source={require("../../assets/images/icons/Users.png")} style={styles.icon} />
        </TouchableOpacity>
      </View>
 
      <TouchableOpacity
        style={[styles.saveButton, { opacity: role ? 1 : 0.5 }]}
        disabled={!role || loading}
        onPress={handleSave}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};
 
export default RoleSelectionScreen;
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFDFD",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
    color: "#222",
  },
  subText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  optionContainer: {
    marginTop: 10,
  },
  optionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedCard: {
    borderColor: "#6C63FF",
    borderWidth: 2,
    backgroundColor: "#F1F0FF",
  },
  optionText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  saveButton: {
    backgroundColor: "#6C63FF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 30,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
});
 