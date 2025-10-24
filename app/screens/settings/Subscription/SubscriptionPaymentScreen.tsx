
import React, { useState } from 'react';

import {

  View,

  Text,

  StyleSheet,

  TouchableOpacity,

  ScrollView,

  Image,

  Animated,

  Alert,

} from 'react-native';

import Header from '../../../layout/Header';

import { useTheme, useRoute } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import RazorpayCheckout from 'react-native-razorpay';
 
interface Plan {

  id: string;

  price: string;

  duration: string;

  planType?: string;

}
 
const SubscriptionPaymentScreen: React.FC = () => {

  const { colors } = useTheme();

  const route = useRoute();

  const { id, price, duration, planType } = route.params || {};
 
  const [selectedPlan] = useState<Plan>({

    id: id || '',

    price: price || '0',

    duration: duration || '',

    planType: planType || '',

  });
 
  const scaleAnim = new Animated.Value(1);
 
  const handleButtonPressIn = () => {

    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();

  };
 
  const handleButtonPressOut = () => {

    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  };
 
  // ===================== STEP 1: Create Razorpay Subscription =====================

  const createSubscription = async () => {

    try {

      const token = await AsyncStorage.getItem('userToken');
    
      const res = await fetch('http://192.168.1.10:5000/api/user/plan/subscription', {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

          Authorization: `Bearer ${token}`,

        },

        body: JSON.stringify({ planId: selectedPlan.id }),

      });
 
      const data = await res.json();
      console.log(data)
      if (!data.subscription) {

        Alert.alert('Error', 'Failed to create subscription');

        return null;

      }
 
      // Return Razorpay subscription ID

      return data.subscription.razorpaySubscriptionId;

    } catch (err: any) {

      console.error(err);

      Alert.alert('Error', err.message || 'Something went wrong');

      return null;

    }

  };
 
  // ===================== STEP 2: Confirm Payment =====================

  const confirmPayment = async (paymentSuccess: any) => {

    try {

      const token = await AsyncStorage.getItem('userToken');

      const userData = await AsyncStorage.getItem('user');

      const user = userData ? JSON.parse(userData) : { _id: '' };
 
      const res = await fetch('http://192.168.1.10:5000/api/user/plan/subscription', {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

          Authorization: `Bearer ${token}`,

        },

        body: JSON.stringify({

          planId: selectedPlan.id,

          result: 'success',

          razorpay_payment_id: paymentSuccess.razorpay_payment_id,

          razorpay_subscription_id: paymentSuccess.razorpay_subscription_id,

          razorpay_signature: paymentSuccess.razorpay_signature,

          userId: user._id,

        }),

      });
 
      const confirmData = await res.json();

      Alert.alert('Payment Success', confirmData.message);

    } catch (err: any) {

      console.error(err);

      Alert.alert('Error', err.message || 'Something went wrong');

    }

  };
 
  // ===================== HANDLE PAYMENT BUTTON =====================

  const makePayment = async () => {

    // Step 1: Create subscription

    const razorpaySubscriptionId = await createSubscription();

    if (!razorpaySubscriptionId) return;
 
    const userData = await AsyncStorage.getItem('user');

    const user = userData ? JSON.parse(userData) : { name: '', email: '', contact: '' };
 
    // Step 2: Open Razorpay Checkout

    const options = {

      description: `Subscription for ${selectedPlan.planType}`,

      currency: 'INR',

      key: 'rzp_test_BtBiABrCuK7ooM', // Replace with your key

      amount: Number(selectedPlan.price) * 100, // in paise

      name: 'Prithu',

      order_id: razorpaySubscriptionId,

      prefill: {

        name: user.name,

        email: user.email,

        contact: user.contact,

      },

      theme: { color: '#53a20e' },

    };
 
    RazorpayCheckout.open(options)

      .then(confirmPayment)

      .catch((error) => {

        Alert.alert('Payment Failed', `${error.code} | ${error.description}`);

      });

  };
 
  return (
<View style={[styles.container, { backgroundColor: colors.background }]}>
<Header title="Payment Subscription" />
<View style={styles.companySection}>
<Image

          source={require('../../../assets/images/icons/prithu.png')}

          style={styles.logo}

          resizeMode="contain"

        />
<View>
<Text style={styles.companyName}>Prithu</Text>
<Text style={styles.companyTagline}>Unlock Your Subscription</Text>
</View>
</View>
<ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Plan Details */}
<View style={styles.planCard}>
<Text style={styles.sectionTitle}>Plan Details</Text>
<View style={styles.detailRow}>
<Text style={styles.label}>Plan ID</Text>
<Text style={styles.value}>{selectedPlan.id}</Text>
</View>
<View style={styles.detailRow}>
<Text style={styles.label}>Plan Type</Text>
<Text style={styles.value}>{selectedPlan.planType}</Text>
</View>
<View style={styles.detailRow}>
<Text style={styles.label}>Plan Duration</Text>
<Text style={styles.value}>{selectedPlan.duration}</Text>
</View>
<View style={styles.detailRow}>
<Text style={styles.label}>Plan Amount</Text>
<Text style={[styles.value, styles.amount]}>₹{selectedPlan.price}</Text>
</View>
</View>
 
        {/* Payment Summary */}
<View style={styles.paymentCard}>
<Text style={styles.sectionTitle}>Payment Summary</Text>
<View style={styles.summaryRow}>
<Text style={styles.summaryLabel}>Subscription Cost</Text>
<Text style={styles.summaryValue}>₹{selectedPlan.price}</Text>
</View>
<View style={styles.divider} />
<View style={styles.summaryRow}>
<Text style={styles.totalLabel}>Total Amount</Text>
<Text style={[styles.summaryValue, styles.totalAmount]}>₹{selectedPlan.price}</Text>
</View>
</View>
</ScrollView>
 
      {/* Pay Button */}
<View style={styles.footer}>
<TouchableOpacity

          style={styles.payButton}

          onPressIn={handleButtonPressIn}

          onPressOut={handleButtonPressOut}

          onPress={makePayment}
>
<Animated.View style={[styles.payButtonInner, { transform: [{ scale: scaleAnim }] }]}>
<Text style={styles.payButtonText}>Pay Now</Text>
</Animated.View>
</TouchableOpacity>
</View>
</View>

  );

};
 
const styles = StyleSheet.create({

  container: { flex: 1 },

  scrollContent: { padding: 20, paddingBottom: 100 },

  companySection: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'flex-start',

    paddingVertical: 10,

    borderBottomColor: '#ddd',

    marginLeft: 25,

  },

  logo: { width: 50, height: 50, marginRight: 8 },

  companyName: { fontSize: 25, fontWeight: '700', color: '#2d2d54', textAlign: 'left' },

  companyTagline: { fontSize: 14, fontWeight: '400', color: '#666' },

  planCard: {

    backgroundColor: '#fff',

    borderRadius: 16,

    padding: 20,

    marginBottom: 20,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.15,

    shadowRadius: 8,

    elevation: 5,

  },

  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#2d2d54', marginBottom: 15 },

  detailRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 12,

    paddingVertical: 8,

    borderBottomWidth: 1,

    borderBottomColor: '#f0f0f0',

  },

  label: { fontSize: 16, fontWeight: '600', color: '#333' },

  value: { fontSize: 16, fontWeight: '400', color: '#2d2d54' },

  amount: { fontSize: 20, fontWeight: '700', color: '#007BFF' },

  paymentCard: {

    backgroundColor: '#fff',

    borderRadius: 16,

    padding: 20,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.15,

    shadowRadius: 8,

    elevation: 5,

  },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  divider: { height: 2, marginTop: 40, backgroundColor: '#e8ecef', marginVertical: 10 },

  summaryLabel: { fontSize: 16, fontWeight: '600', color: '#333' },

  summaryValue: { fontSize: 18, fontWeight: '500', color: '#2d2d54' },

  totalLabel: { fontSize: 18, fontWeight: '700', color: '#333' },

  totalAmount: { fontSize: 20, fontWeight: '700', color: '#007BFF' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ddd', alignItems: 'center' },

  payButton: { width: '100%', maxWidth: 400 },

  payButtonInner: { backgroundColor: '#007BFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },

  payButtonText: { fontSize: 18, fontWeight: '700', color: '#fff' },

});
 
export default SubscriptionPaymentScreen;

 