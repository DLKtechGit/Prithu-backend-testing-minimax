import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../../../apiInterpretor/apiInterceptor";
 
const GenderScreen: React.FC = () => {
  const [gender, setGender] = useState<"Male" | "Female" | "Other" | null>(null);
  const navigation = useNavigation<any>();
 
  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("gender", gender!);

      const response = await api.post(
        "/api/user/profile/detail/update",
        formData
      );

      if (response.data) {
        alert("Gender updated successfully!");
        navigation.navigate('DrawerNavigation', { screen: 'Home' });
      } else {
        alert("Update failed");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Something went wrong while saving";
      alert(errorMessage);
      console.error(err);
    }
  };
 
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Choose Your Gender</Text>
      <Text style={styles.subText}>
        Health-related insights and personalized recommendations are built based
        on your gender.
      </Text>
 
      <View style={styles.optionContainer}>
        <TouchableOpacity
          style={[
            styles.optionCard,
            gender === "Male" && styles.selectedCard,
          ]}
          onPress={() => setGender("Male")}
        >
          <Text style={styles.optionText}>Male</Text>
          <Image
            source={require("../../assets/images/icons/male.png")} // your male icon
            style={styles.icon}
          />
        </TouchableOpacity>
 
        <TouchableOpacity
          style={[
            styles.optionCard,
            gender === "Female" && styles.selectedCard,
          ]}
          onPress={() => setGender("Female")}
        >
          <Text style={styles.optionText}>Female</Text>
          <Image
            source={require("../../assets/images/icons/female.png")} // your female icon
            style={styles.icon}
          />
        </TouchableOpacity>
 
        <TouchableOpacity
          style={[
            styles.optionCard,
            gender === "Other" && styles.selectedCard,
          ]}
          onPress={() => setGender("Other")}
        >
          <Text style={styles.optionText}>Other</Text>
          <Image
            source={require("../../assets/images/icons/female.png")} // your other icon
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
 
      <TouchableOpacity
        style={[styles.saveButton, { opacity: gender ? 1 : 0.5 }]}
        disabled={!gender}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};
 
export default GenderScreen;
 
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
 