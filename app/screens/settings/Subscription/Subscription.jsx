
// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   Dimensions,
//   Alert,
// } from "react-native";
// import { CheckCircle2 } from "lucide-react-native"; // Lucide icon
// import { useNavigation, useRoute } from "@react-navigation/native";
// import { LinearGradient } from "expo-linear-gradient";
// import axios from "axios"; // Import axios for API calls
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const { width, height } = Dimensions.get("window");

// const SubscriptionScreen = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   // Extract params from navigation, fallback to empty object
//   const { id, price, duration } = route.params || {};

//   // State to store plan details and fetched plans
//   const [planDetails, setPlanDetails] = useState({
//     price: price ,// Fallback to dummy price until fetched
//     duration: duration, // Fallback to dummy duration until fetched
//   });
//   const [isLoading, setIsLoading] = useState(false); // Add loading state
//   const [fetchedPlans, setFetchedPlans] = useState([]); // Store fetched plans

//   // Debug navigation params
//   useEffect(() => {
//     console.log("Navigation params:", { id, price, duration });
//   }, [id, price, duration]);

//   // Fetch plans from backend
//   useEffect(() => {
//     const fetchPlans = async () => {
//       try {
//         const response = await axios.get("http://192.168.1.6:5000/api/user/getall/subscriptions");
//         console.log("Fetch plans response:", response.data);
//         const plans = response.data.plans.map((plan) => ({
//           id: plan._id, // Use MongoDB _id
//           duration: `${plan.durationYears} ${plan.durationYears === "1" ? "year" : "years"}`,
//           price: plan.price.toString(), // Ensure price is a string
//         }));
//         setFetchedPlans(plans);

//         // If id, price, and duration are provided via navigation, use them
//         if (id && price && duration) {
//           setPlanDetails({ price, duration });
//           return;
//         }

//         // Otherwise, set default plan (e.g., plan with highest duration)
//         const maxDurationPlan = plans.reduce((max, plan) => {
//           const currentDuration = parseInt(plan.duration.split(" ")[0]);
//           const maxDuration = parseInt(max.duration.split(" ")[0]);
//           return currentDuration > maxDuration ? plan : max;
//         }, plans[0]);

//         setPlanDetails({
//           price: maxDurationPlan.price,
//           duration: maxDurationPlan.duration,
//         });
//       } catch (error) {
//         console.error("Error fetching plans:", error);
//         // Keep fallback values if fetch fails
//         setPlanDetails({ price: "499", duration: "1 Year" });
//         setFetchedPlans([]);
//       }
//     };

//     fetchPlans();
//   }, [id, price, duration]); // Re-run if navigation params change

//   return (
//     <View style={styles.container}>
//       {/* Close Button */}
//       <TouchableOpacity
//         style={styles.closeButton}
//         onPress={() => navigation.goBack()}
//       >
//         <Text style={styles.closeText}>×</Text>
//       </TouchableOpacity>

//       {/* Rocket Image */}
//       <Image
//         source={require("../../../assets/images/rocketss.png")}
//         style={styles.rocket}
//         resizeMode="contain"
//       />

//       {/* Title */}
//       <Text style={styles.title}>Upgrade to Premium</Text>

//       {/* Features */}
//       <View style={styles.featureContainer}>
//         <View style={styles.featureRow}>
//           <CheckCircle2 size={20} color="#316BFF" />
//           <Text style={styles.featureText}>Unlimited Access to our Podcasts</Text>
//         </View>
//         <View style={styles.featureRow}>
//           <CheckCircle2 size={20} color="#316BFF" />
//           <Text style={styles.featureText}>Unlimited Songs Download</Text>
//         </View>
//         <View style={styles.featureRow}>
//           <CheckCircle2 size={20} color="#316BFF" />
//           <Text style={styles.featureText}>Unlimited Skips</Text>
//         </View>
//       </View>

//       {/* Price */}
//       <Text style={styles.price}>
//         ₹ <Text style={styles.priceValue}>{planDetails.price}</Text>
//         <Text style={styles.duration}> /{planDetails.duration}</Text>
//       </Text>

//       {/* Button */}
//       <TouchableOpacity
//         style={[styles.button, isLoading && styles.buttonDisabled]}
//         onPress={async () => {
//           setIsLoading(true);
//           try {
//             const token = await AsyncStorage.getItem("userToken");
//             if (!token) {
//               Alert.alert("Error", "You must be logged in to subscribe.");
//               setIsLoading(false);
//               return;
//             }

//             let planId = id;
//             // If no id is provided, find the plan matching the displayed price
//             if (!planId && fetchedPlans.length > 0) {
//               const matchingPlan = fetchedPlans.find(
//                 (plan) => plan.price === planDetails.price
//               );
//               if (matchingPlan) {
//                 planId = matchingPlan.id;
//                 console.log("Matched plan by price:", matchingPlan);
//               }
//             }

//             if (!planId) {
//               console.warn("No plan ID provided or matched by price");
//               Alert.alert("Error", "No plan selected. Please go back and select a plan.");
//               setIsLoading(false);
//               return;
//             }

//             console.log("Sending planId:", planId); // Debug planId
//             const response = await axios.post(
//               "http://192.168.1.6:5000/api/user/plan/subscription",
//               {
//                 planId, // Use the resolved planId
//                 result: "success",
//               },
//               {
//                 headers: {
//                   Authorization: `Bearer ${token}`, // Include auth token
//                 },
//               }
//             );
//            console.log(response)
//             if (response.status === 200) {
//               Alert.alert("Success", "Subscription activated successfully!");
//               navigation.navigate("DrawerNavigation", { screen: "Home" });
//             } else {
//               Alert.alert("Error", response.data.message || "Subscription failed.");
//             }
//           } catch (error) {
//             console.error("Error subscribing to plan:", error);
//             const message =
//               error.response?.data?.message || "Failed to subscribe. Please try again.";
//             Alert.alert("Error", message);
//           } finally {
//             setIsLoading(false);
//           }
//         }}
//         disabled={isLoading}
//       >
//         <LinearGradient
//           colors={["yellow", "green"]} // yellow → green
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.gradient}
//         >
//           <Text style={styles.buttonText}>
//             {isLoading ? "Processing..." : "Go Premium"}
//           </Text>
//         </LinearGradient>
//       </TouchableOpacity>

//       {/* Other Plans */}
//       <TouchableOpacity onPress={() => navigation.navigate("PlanSubcribe")}>
//         <Text style={styles.otherPlans}>Other Plans</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: width * 0.05,
//     paddingTop: height * 0.05,
//   },
//   closeButton: {
//     position: "absolute",
//     top: height * 0.05,
//     right: width * 0.05,
//   },
//   closeText: {
//     fontSize: width * 0.08,
//     color: "#000",
//   },
//   rocket: {
//     width: width * 0.55,
//     height: height * 0.38,
//     marginBottom: height * 0.01,
//   },
//   title: {
//     fontSize: width * 0.08,
//     fontWeight: "700",
//     color: "#161648",
//     marginBottom: height * 0.02,
//     textAlign: "center",
//   },
//   featureContainer: {
//     marginBottom: height * 0.04,
//     width: "90%",
//   },
//   featureRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: height * 0.015,
//   },
//   featureText: {
//     fontSize: width * 0.04,
//     color: "#2d2d54",
//     marginLeft: 9,
//   },
//   price: {
//     fontSize: width * 0.045,
//     marginBottom: height * 0.025,
//     color: "#2d2d54",
//     textAlign: "center",
//   },
//   priceValue: {
//     fontSize: width * 0.085,
//     fontWeight: "700",
//     color: "#2d2d54",
//   },
//   duration: {
//     fontSize: width * 0.035,
//     color: "gray",
//   },
//   button: {
//     borderRadius: width * 0.04,
//     overflow: "hidden",
//     marginBottom: height * 0.03,
//     elevation: 4,
//     shadowColor: "#316BFF",
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 6,
//   },
//   buttonDisabled: {
//     opacity: 0.6,
//   },
//   gradient: {
//     paddingVertical: height * 0.018,
//     paddingHorizontal: width * 0.25,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   buttonText: {
//     color: "#fff",
//     fontSize: width * 0.045,
//     fontWeight: "600",
//   },
//   otherPlans: {
//     fontSize: width * 0.04,
//     color: "#316BFF",
//     textDecorationLine: "underline",
//   },
// });

// export default SubscriptionScreen;


import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { CheckCircle2 } from "lucide-react-native"; // Lucide icon
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios"; // Import axios for API calls
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IMAGES } from "../../../constants/theme";

const { width, height } = Dimensions.get("window");

const SubscriptionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // Extract params from navigation, fallback to empty object
  const { id, price, duration } = route.params || {};

  // State to store plan details and fetched plans
  const [planDetails, setPlanDetails] = useState({
    price: price ,// Fallback to dummy price until fetched
    duration: duration, // Fallback to dummy duration until fetched
  });
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [fetchedPlans, setFetchedPlans] = useState([]); // Store fetched plans
  const [showPopup, setShowPopup] = useState(false); // State to control popup visibility
  const [popupMessage, setPopupMessage] = useState(''); // Message for the popup
  const [popupSubtitle, setPopupSubtitle] = useState(''); // Subtitle for the popup
  const fadeAnim = useState(new Animated.Value(0))[0]; // Animation value for fade and position

  // Debug navigation params
  useEffect(() => {
    console.log("Navigation params:", { id, price, duration });
  }, [id, price, duration]);

  // Fetch plans from backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get("http://192.168.1.6:5000/api/user/getall/subscriptions");
        console.log("Fetch plans response:", response.data);
        const plans = response.data.plans.map((plan) => ({
          id: plan._id, // Use MongoDB _id
          duration: `${plan.durationYears} ${plan.durationYears === "1" ? "year" : "years"}`,
          price: plan.price.toString(), // Ensure price is a string
        }));
        setFetchedPlans(plans);

        // If id, price, and duration are provided via navigation, use them
        if (id && price && duration) {
          setPlanDetails({ price, duration });
          return;
        }

        // Otherwise, set default plan (e.g., plan with highest duration)
        const maxDurationPlan = plans.reduce((max, plan) => {
          const currentDuration = parseInt(plan.duration.split(" ")[0]);
          const maxDuration = parseInt(max.duration.split(" ")[0]);
          return currentDuration > maxDuration ? plan : max;
        }, plans[0]);

        setPlanDetails({
          price: maxDurationPlan.price,
          duration: maxDurationPlan.duration,
        });
      } catch (error) {
        console.error("Error fetching plans:", error);
        // Keep fallback values if fetch fails
        setPlanDetails({ price: "499", duration: "1 Year" });
        setFetchedPlans([]);
      }
    };

    fetchPlans();
  }, [id, price, duration]); // Re-run if navigation params change

  useEffect(() => {
    if (showPopup) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showPopup, fadeAnim]);

  // Custom Popup Component
  const Popup = () => (
    <Animated.View style={[styles.popupOverlay, {
      opacity: fadeAnim,
      transform: [{
        translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0] // Slide from 300 (bottom) to 0 (top)
        })
      }]
    }]}>
      <View style={styles.popupContainer}>
        <Image
          source={IMAGES.bugrepellent}// Replace with your character image
          style={styles.popupImage}
        />
        <Text style={styles.popupTitle}>{popupMessage}</Text>
        <Text style={styles.popupSubtitle}>{popupSubtitle}</Text>
        <TouchableOpacity style={styles.popupButton} onPress={() => setShowPopup(false)}>
          <Text style={styles.popupButtonText}>Let's Go</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>

      {/* Rocket Image */}
      <Image
        source={require("../../../assets/images/rocketss.png")}
        style={styles.rocket}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={styles.title}>Upgrade to Premium</Text>

      {/* Features */}
      <View style={styles.featureContainer}>
        <View style={styles.featureRow}>
          <CheckCircle2 size={20} color="#316BFF" />
          <Text style={styles.featureText}>Unlimited Access to our Podcasts</Text>
        </View>
        <View style={styles.featureRow}>
          <CheckCircle2 size={20} color="#316BFF" />
          <Text style={styles.featureText}>Unlimited Songs Download</Text>
        </View>
        <View style={styles.featureRow}>
          <CheckCircle2 size={20} color="#316BFF" />
          <Text style={styles.featureText}>Unlimited Skips</Text>
        </View>
      </View>

      {/* Price */}
      <Text style={styles.price}>
        ₹ <Text style={styles.priceValue}>{planDetails.price}</Text>
        <Text style={styles.duration}> /{planDetails.duration}</Text>
      </Text>

      {/* Button */}
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={async () => {
          setIsLoading(true);
          try {
            const token = await AsyncStorage.getItem("userToken");
            if (!token) {
              setPopupMessage('Error!');
              setPopupSubtitle('You must be logged in to subscribe.');
              setShowPopup(true);
              setIsLoading(false);
              return;
            }

            let planId = id;
            // If no id is provided, find the plan matching the displayed price
            if (!planId && fetchedPlans.length > 0) {
              const matchingPlan = fetchedPlans.find(
                (plan) => plan.price === planDetails.price
              );
              if (matchingPlan) {
                planId = matchingPlan.id;
                console.log("Matched plan by price:", matchingPlan);
              }
            }

            if (!planId) {
              console.warn("No plan ID provided or matched by price");
              setPopupMessage('Error!');
              setPopupSubtitle('No plan selected. Please go back and select a plan.');
              setShowPopup(true);
              setIsLoading(false);
              return;
            }

            console.log("Sending planId:", planId); // Debug planId
            const response = await axios.post(
              "http://192.168.1.6:5000/api/user/plan/subscription",
              {
                planId, // Use the resolved planId
                result: "success",
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`, // Include auth token
                },
              }
            );
           console.log(response)
            if (response.status === 200) {
              setPopupMessage('Success');
              setPopupSubtitle('Subscription activated successfully!');
              setShowPopup(true);
              setTimeout(() => {
                navigation.navigate("DrawerNavigation", { screen: "Home" });
              }, 1000); // Delay navigation to show success message
            } else {
              setPopupMessage('Error!');
              setPopupSubtitle(response.data.message || "Subscription failed.");
              setShowPopup(true);
            }
          } catch (error) {
            console.error("Error subscribing to plan:", error);
            const message =
              error.response?.data?.message || "Failed to subscribe. Please try again.";
            setPopupMessage('Error!');
            setPopupSubtitle(message);
            setShowPopup(true);
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isLoading}
      >
        <LinearGradient
          colors={["yellow", "green"]} // yellow → green
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Processing..." : "Go Premium"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Other Plans */}
      <TouchableOpacity onPress={() => navigation.navigate("PlanSubcribe")}>
        <Text style={styles.otherPlans}>Other Plans</Text>
      </TouchableOpacity>
      {showPopup && <Popup />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.05,
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
  rocket: {
    width: width * 0.55,
    height: height * 0.38,
    marginBottom: height * 0.01,
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: "700",
    color: "#161648",
    marginBottom: height * 0.02,
    textAlign: "center",
  },
  featureContainer: {
    marginBottom: height * 0.04,
    width: "90%",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.015,
  },
  featureText: {
    fontSize: width * 0.04,
    color: "#2d2d54",
    marginLeft: 9,
  },
  price: {
    fontSize: width * 0.045,
    marginBottom: height * 0.025,
    color: "#2d2d54",
    textAlign: "center",
  },
  priceValue: {
    fontSize: width * 0.085,
    fontWeight: "700",
    color: "#2d2d54",
  },
  duration: {
    fontSize: width * 0.035,
    color: "gray",
  },
  button: {
    borderRadius: width * 0.04,
    overflow: "hidden",
    marginBottom: height * 0.03,
    elevation: 4,
    shadowColor: "#316BFF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.25,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "600",
  },
  otherPlans: {
    fontSize: width * 0.04,
    color: "#316BFF",
    textDecorationLine: "underline",
  },
  popupOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    elevation: 10,
  },
  popupImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  popupSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
  popupButton: {
    backgroundColor: '#28A745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  popupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SubscriptionScreen;