import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios"; // Import axios for API calls

const { width, height } = Dimensions.get("window");

const SubscriptionPlans = () => {
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState(null); // Default selected = null until fetched
  const [plans, setPlans] = useState([]); // State to store fetched plans

  // Fetch plans from backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get("http://192.168.1.17:5000/api/user/getall/subscriptions");
        console.log(response);
        const fetchedPlans = response.data.plans.map((plan) => ({
          id: plan._id, // Use MongoDB _id instead of index-based ID
          duration: plan.durationYears, // Use durationYears from backend
          unit: plan.durationYears === "1" ? "year" : "years", // Convert to singular/plural
          price: `₹${plan.price}`, // Format price with ₹ symbol
          perMonth: `${(plan.price / (plan.durationDays / 30)).toFixed(1)} / month`, // Calculate per month
          badge: `Save ${plan.discount || 0} %`, // Use discount if available, else 0
          badgeColor: plan.discount >= 40 ? "#E0F8E9" : plan.discount >= 25 ? "#FFF4CC" : "#f1f1f1", // Set badge color based on discount
          badgeTextColor: plan.discount >= 25 ? "#2d2d54" : "gray", // Set badge text color
          popular: plan.discount >= 40, // Mark as popular if discount is 40% or more
        }));
        setPlans(fetchedPlans);
        // Set default selected plan to the one with the highest duration
        const maxDurationPlan = fetchedPlans.reduce((max, plan) =>
          parseInt(plan.duration) > parseInt(max.duration) ? plan : max
        );
        setSelectedPlan(maxDurationPlan.id);
      } catch (error) {
        console.error("Error fetching plans:", error);
        // Fallback to empty array if fetch fails
        setPlans([]);
      }
    };
    fetchPlans();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>Special Plans</Text>
      <Text style={styles.subtitle}>Pick the right plan for you</Text>

      {/* Plans */}
      {plans.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={[
            styles.planCard,
            selectedPlan === plan.id && styles.planCardSelected,
          ]}
          onPress={() => setSelectedPlan(plan.id)}
          activeOpacity={0.8}
        >
          {/* Most Popular Badge */}
          {plan.popular && (
            <LinearGradient
              colors={["#FFD700", "green"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.popularBadge}
            >
              <Text style={styles.popularText}>Most Popular</Text>
            </LinearGradient>
          )}

          {/* Left Side */}
          <View style={styles.planLeft}>
            <Text style={styles.planDuration}>{plan.duration}</Text>
            <Text style={styles.planText}>{plan.unit}</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: plan.badgeColor },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: plan.badgeTextColor },
                ]}
              >
                {plan.badge}
              </Text>
            </View>
          </View>

          {/* Right Side */}
          <View style={styles.planRight}>
            <Text style={styles.planPrice}>{plan.price}</Text>
            <Text style={styles.planPerMonth}>{plan.perMonth}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Subscribe Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          const selectedPlanData = plans.find((plan) => plan.id === selectedPlan);
          if (selectedPlanData) {
            navigation.navigate("Subcribe", {
              id: selectedPlanData.id,
              price: selectedPlanData.price.replace("₹", ""), // Remove ₹ symbol
              duration: `${selectedPlanData.duration} ${selectedPlanData.unit}`,
            });
          }
        }}
      >
        <LinearGradient
          colors={["#FFD700", "green"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={styles.buttonText}>Subscribe Now</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    padding: width * 0.05,
    paddingTop: height * 0.07,
  },
  closeButton: {
    position: "absolute",
    top: height * 0.05,
    right: width * 0.05,
  },
  closeText: {
    fontSize: width * 0.08,
    color: "#000",
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: "700",
    color: "#2d2d54",
    marginBottom: height * 0.005,
    textAlign: "center",
  },
  subtitle: {
    fontSize: width * 0.04,
    color: "gray",
    marginBottom: height * 0.04,
    textAlign: "center",
  },
  planCard: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: width * 0.05,
    backgroundColor: "#fff",
    borderRadius: width * 0.04,
    marginBottom: height * 0.04,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: "relative",
  },
  planCardSelected: {
    borderWidth: 2,
    borderColor: "#FFD700", // Yellow border when selected
  },
  planLeft: {
    justifyContent: "center",
  },
  planDuration: {
    fontSize: width * 0.07,
    fontWeight: "700",
    color: "#2d2d54",
  },
  planText: {
    fontSize: width * 0.04,
    color: "#2d2d54",
    marginBottom: height * 0.01,
  },
  badge: {
    borderRadius: width * 0.02,
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: width * 0.03,
    fontWeight: "500",
  },
  planRight: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  planPrice: {
    fontSize: width * 0.055,
    fontWeight: "700",
    color: "#2d2d54",
  },
  planPerMonth: {
    fontSize: width * 0.035,
    color: "gray",
  },
  popularBadge: {
    position: "absolute",
    top: -height * 0.02,
    alignSelf: "center",
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  popularText: {
    color: "#fff",
    fontSize: width * 0.03,
    fontWeight: "600",
  },
  button: {
    borderRadius: width * 0.04,
    overflow: "hidden",
    marginTop: height * 0.04,
    width: "100%",
    elevation: 4,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  gradient: {
    paddingVertical: height * 0.02,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: width * 0.04,
  },
  buttonText: {
    color: "#fff",
    fontSize: width * 0.05,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default SubscriptionPlans;