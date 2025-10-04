import React from 'react';
import { View, Text, Image, Alert, TouchableOpacity, TextInput, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, IMAGES, SIZES } from '../../constants/theme';
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import Button from '../../components/button/Button';
import OTPTextInput from 'react-native-otp-textinput';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OtpScreenProps = StackScreenProps<RootStackParamList, 'Otp'>;

const Otp = ({ navigation }: OtpScreenProps) => {
    const theme = useTheme();
    const { colors }: { colors: any } = theme;

    const [show, setShow] = React.useState(true);
    const [otp, setOtp] = React.useState("");
    const [showPopup, setShowPopup] = React.useState(false); // State for popup visibility
    const [popupMessage, setPopupMessage] = React.useState(''); // Popup title
    const [popupSubtitle, setPopupSubtitle] = React.useState(''); // Popup subtitle
    const [inputFocus, setFocus] = React.useState({
        onFocus1: false,
        onFocus2: false
    });

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            setPopupMessage('Error!');
            setPopupSubtitle('Please enter the full OTP');
            setShowPopup(true);
            return;
        }

        try {
            const response = await fetch("http://192.168.1.17:5000/api/auth/exist/user/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp }),
            });

            const data = await response.json();
            console.log("Backend response:", data);

            if (response.ok) {
                console.log(data.email);
                await AsyncStorage.removeItem('verifiedEmail');
                await AsyncStorage.setItem('verifiedEmail', data.email);
                setPopupMessage('Success');
                setPopupSubtitle('OTP verified successfully!');
                setShowPopup(true);
            } else {
                setPopupMessage('Error!');
                setPopupSubtitle(data.message || "Invalid OTP, please try again");
                setShowPopup(true);
            }
        } catch (error) {
            console.error("OTP Verify Error:", error);
            setPopupMessage('Error!');
            setPopupSubtitle('Something went wrong. Please try again later.');
            setShowPopup(true);
        }
    };

    // Custom Popup Component
    const Popup = () => (
        <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
        }}>
            <View style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
                width: '90%',
                elevation: 10,
            }}>
                <Image
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        marginBottom: 15,
                    }}
                    source={IMAGES.bugrepellent} // Use same image as Forgot
                />
                <Text style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#333',
                    textAlign: 'center',
                }}>{popupMessage}</Text>
                <Text style={{
                    fontSize: 14,
                    color: '#666',
                    textAlign: 'center',
                    marginVertical: 10,
                }}>{popupSubtitle}</Text>
                <TouchableOpacity
                    style={{
                        backgroundColor: '#28A745',
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 8,
                        marginTop: 15,
                    }}
                    onPress={() => {
                        setShowPopup(false);
                        if (popupMessage === 'Success') {
                            navigation.navigate('ChangePassword');
                        }
                    }}
                >
                    <Text style={{
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 'bold',
                        textAlign: 'center',
                    }}>Let's Go</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[GlobalStyleSheet.container, { padding: 0, flex: 1 }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                //behavior={Platform.OS === 'ios' ? 'padding' : ''}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ backgroundColor: COLORS.secondary, flex: 1 }}>
                        <View style={{ alignItems: 'center' }}>
                            <LinearGradient colors={['rgba(255, 255, 255, 0.00)', 'rgba(255, 255, 255, 0.08)']} style={GlobalStyleSheet.cricleGradient1}>
                            </LinearGradient>
                            <LinearGradient colors={['rgba(255, 255, 255, 0.00)', 'rgba(255, 255, 255, 0.08)']} style={GlobalStyleSheet.cricleGradient2}>
                            </LinearGradient>
                            <View
                                style={{
                                    paddingTop: 40,
                                    paddingBottom: 20
                                }}
                            >
                                <Image
                                    style={{ width: 80, height: 80 }}
                                    source={IMAGES.logo}
                                />
                            </View>
                            <Text style={GlobalStyleSheet.formtitle}>Enter Code</Text>
                            <Text style={GlobalStyleSheet.forndescription}>Please enter your credentials to access your account and detail</Text>
                        </View>
                        <View style={[GlobalStyleSheet.loginarea, { backgroundColor: colors.card }]}>
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                <OTPTextInput
                                    tintColor={colors.background}
                                    handleTextChange={(text: string) => setOtp(text)}
                                    inputCount={4}
                                    textInputStyle={{
                                        borderBottomWidth: 0,
                                        height: 48,
                                        width: 48,
                                        borderRadius: SIZES.radius,
                                        backgroundColor: colors.input,
                                    }}
                                />
                            </View>

                            <View style={{ marginTop: 10 }}>
                                <Button title="Next" onPress={handleVerifyOtp} />
                            </View>

                            <View style={{ flex: 1 }}></View>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
                                <Text style={{ ...FONTS.font, color: colors.text }}>Already have an account
                                </Text>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    <Text style={{ ...FONTS.font, color: COLORS.primary, textDecorationLine: 'underline', textDecorationColor: '#2979F8', marginLeft: 5 }}>Sign In</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            {showPopup && <Popup />}
        </SafeAreaView>
    );
};

export default Otp;