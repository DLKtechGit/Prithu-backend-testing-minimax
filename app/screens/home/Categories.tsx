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
import api from '../../../apiInterpretor/apiInterceptor';

const { width } = Dimensions.get("window");
const ITEM_PER_ROW = 4;
const SPACING = 8;
const itemWidth = (width - SPACING * (ITEM_PER_ROW + 1)) / ITEM_PER_ROW;

// Skeleton Loader Component
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

// Main Categories Component
interface CategoriesProps {
  onSelectCategory: (id: string | null) => void;
}

const Categories: React.FC<CategoriesProps> = ({ onSelectCategory }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>("all");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/api/user/get/content/catagories");

        if (Array.isArray(response.data.categories)) {
          const safeCategories = response.data.categories.map((cat: any, index: number) => ({
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

  // Handle Category Selection
  const handleSelect = (id: string | null) => {
    setSelectedCategory(id);
    onSelectCategory(id);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[...Array(ITEM_PER_ROW + 2)].map((_, index) => (
            <SkeletonCategoryItem key={index} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          {/* 'All' Button - Always at the Start */}
          <LinearGradient
            colors={["#FFD700", "#32CD32"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <TouchableOpacity
              style={[
                styles.item,
                selectedCategory === "all"
                  ? { backgroundColor: "transparent" } // full gradient when selected
                  : { backgroundColor: "#fff" }, // white inside with gradient border
              ]}
              activeOpacity={1}
              onPress={() => {
                setSelectedCategory("all");
                onSelectCategory(null); // tell PostList to fetch all posts
              }}
            >
              <Text
                style={[
                  styles.text,
                  {
                    color: selectedCategory === "all" ? "#fff" : "#333",
                    fontWeight: selectedCategory === "all" ? "600" : "500",
                  },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Other Categories */}
          {categories.map((cat, id) => {
            const isSelected = selectedCategory === cat._id;
            return (
              <LinearGradient
                key={cat._id || id}
                colors={["#FFD700", "#32CD32"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
              >
                <TouchableOpacity
                  style={[
                    styles.item,
                    isSelected
                      ? { backgroundColor: "transparent" } // full gradient when selected
                      : { backgroundColor: "#fff" }, // white with border when not selected
                  ]}
                  onPress={() => handleSelect(cat._id)}
                >
                  <Text
                    style={[
                      styles.text,
                      {
                        color: isSelected ? "#fff" : "#333",
                        fontWeight: isSelected ? "600" : "500",
                      },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    // paddingVertical: 12,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    justifyContent: "flex-start",
  },
  gradient: {
    borderRadius: 16,
    marginRight: SPACING,
    padding: 2,
  },
  item: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    minWidth: itemWidth,
  },
  text: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    textAlign: "center",
  },
  skeletonText: {
    height: 20,
    width: itemWidth - 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
  },
});

export default Categories;