import React from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { getConfig } from '../../config/environment';

const OtpMsg = () => {
  const username = 'Rima'; // Example username, can be dynamic
  const config = getConfig();

  return (
    <SafeAreaView style={styles.container}>
      {/* Company Logo and Name */}
      <View style={styles.header}>
        <Image
          source={require('../../app/assets/images/icons/prithu.png')}

          style={styles.logo}
        />
        <Text style={styles.companyName}>Prithu</Text>
      </View>

      {/* Vertical Picture */}
      <Image
        source={{ uri: config.defaultImageUrl }}
        style={styles.verticalImage}
      />

      {/* Greeting */}
      <Text style={styles.greeting}>hiii {username},</Text>

      {/* OTP Sent Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.heading}>OTP Sent Successfully</Text>
        <Text style={styles.point}>- We've sent a one-time password to your registered email or phone.</Text>
        <Text style={styles.point}>- Please check your inbox or messages.</Text>
        <Text style={styles.point}>- Enter the OTP on the next screen to verify.</Text>
      </View>

      {/* Go to Dashboard Button */}
      <TouchableOpacity style={styles.button} onPress={() => { /* Navigate to dashboard */ }}>
        <Text style={styles.buttonText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0', // Light gray background (not green)
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  verticalImage: {
    width: 200,
    height: 300, // Vertical aspect ratio
    resizeMode: 'contain',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  messageContainer: {
    width: '100%',
    backgroundColor: '#333', // Dark background for contrast with white text
    padding: 15,
    borderRadius: 10,
    marginBottom: 40,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700', // Yellow color
    marginBottom: 10,
  },
  point: {
    fontSize: 16,
    color: '#FFFFFF', // White color
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#007BFF', // Blue button for professionalism
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    alignItems: 'center',
    width: '80%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OtpMsg;