import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage"; // <-- add this

const { width } = Dimensions.get("window");
const ITEM_PER_ROW = 4;
const SPACING = 6;
const itemWidth =
  ((width - SPACING * (ITEM_PER_ROW + 1)) / ITEM_PER_ROW) * 0.85;

const Categories: React.FC<{ onSelectCategory: (id: string) => void }> = ({ onSelectCategory }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // get token from AsyncStorage
        const token = await AsyncStorage.getItem("userToken");

        const res = await fetch("http://192.168.1.6:5000/api/user/get/content/catagories", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "", // send token here
          },
        });

        const data = await res.json();
        console.log(data);

        if (Array.isArray(data.categories)) {
          const safeCategories = data.categories.map((cat: any, index: number) => ({
            _id: cat._id || index,
            name: cat.name || "Unnamed",
          }));
          setCategories(safeCategories);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="small" color="green" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {categories.map((cat, id) => (
            <LinearGradient
              key={cat._id || id}
              colors={["yellow", "green"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gradient, { width: itemWidth }]}
            >
              <TouchableOpacity style={styles.item} onPress={() => onSelectCategory(cat._id)}>
                <Text style={styles.text}>{cat.name}</Text>
              </TouchableOpacity>
            </LinearGradient>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default Categories;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  gradient: {
    borderRadius: 12,
    marginRight: SPACING,
    padding: 2,
  },
  item: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 10,
  },
  text: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});
