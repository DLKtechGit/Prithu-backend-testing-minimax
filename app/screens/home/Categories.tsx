import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const ITEM_PER_ROW = 4;
const SPACING = 6;
const itemWidth =
  ((width - SPACING * (ITEM_PER_ROW + 1)) / ITEM_PER_ROW) * 0.85;

// --------------------------- Skeleton Loader Component ----------------------------

const SkeletonCategoryItem = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmer]);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  return (
    <View style={[styles.gradient, { width: itemWidth }]}>
      <Animated.View
        style={[
          styles.item,
          { opacity: shimmerOpacity }
        ]}
      >
        <Animated.View
          style={[
            styles.skeletonText,
            { opacity: shimmerOpacity }
          ]}
        />
      </Animated.View>
    </View>
  );
};

// --------------------------- Component ----------------------------

const Categories: React.FC<{ onSelectCategory: (id: string) => void }> = ({ onSelectCategory }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");

        const res = await fetch("http://192.168.1.7:5000/api/user/get/content/catagories", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Display multiple skeleton items to mimic category list */}
          {[...Array(ITEM_PER_ROW)].map((_, index) => (
            <SkeletonCategoryItem key={index} />
          ))}
        </ScrollView>
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

// --------------------------- Styles ----------------------------

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
    paddingHorizontal: 4,
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
  skeletonText: {
    height: 20,
    width: "150%",
     backgroundColor: "#e0e0e0",
    borderRadius: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});

export default Categories;