import React from 'react';
import { View, Text, Image, Alert, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, IMAGES } from '../../constants/theme';
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import Button from '../../components/button/Button';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import { StyleSheet } from 'react-native';

type ForgotScreenProps = StackScreenProps<RootStackParamList, 'Forgot'>;

const Forgot = ({ navigation }: ForgotScreenProps) => {
    const theme = useTheme();
    const { colors }: { colors: any } = theme;

    const [show, setShow] = React.useState(true);
    const [inputFocus, setFocus] = React.useState({
        onFocus1: false,
        onFocus2: false
    });
    const [email, setEmail] = React.useState("");
    const [showPopup, setShowPopup] = React.useState(false); // State for popup visibility
    const [popupMessage, setPopupMessage] = React.useState(''); // Popup title
    const [popupSubtitle, setPopupSubtitle] = React.useState(''); // Popup subtitle

    // Function for Next button
    const handleNext = async () => {
        if (!email) {
            setPopupMessage('Error!');
            setPopupSubtitle('Please enter your email');
            setShowPopup(true);
            return;
        }

        try {
            const res = await fetch("http://192.168.1.42:5000/api/auth/user/otp-send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            console.log("Forgot Response:", data);

            if (res.ok) {
                setPopupMessage('Success');
                setPopupSubtitle('OTP has been sent to your email');
                setShowPopup(true);
            } else {
                setPopupMessage('Error!');
                setPopupSubtitle(data.message || "Please fill the required email");
                setShowPopup(true);
            }
        } catch (error) {
            console.error(error);
            setPopupMessage('Error!');
            setPopupSubtitle('Failed to connect to server');
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background for overlay
        }}>
            <View style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
                width: '90%', // Slightly narrower for better appearance
                elevation: 10,
            }}>
                <Image
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        marginBottom: 15,
                    }}
                    source={IMAGES.bugrepellent} // Use same image as SubscriptionScreen
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
                            navigation.navigate('Otp');
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
                            <Text style={GlobalStyleSheet.formtitle}>Forgot Password</Text>
                            <Text style={GlobalStyleSheet.forndescription}>Please enter your credentials to access your account and detail</Text>
                        </View>
                        <View style={[GlobalStyleSheet.loginarea, { backgroundColor: colors.card }]}>
                            <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Email</Text>
                            <View
                                style={[
                                    GlobalStyleSheet.inputBox, {
                                        backgroundColor: colors.input,
                                    },
                                    inputFocus.onFocus1 && {
                                        borderColor: COLORS.primary,
                                    }
                                ]}
                            >
                                <Image
                                    style={[
                                        GlobalStyleSheet.inputimage,
                                        {
                                            tintColor: theme.dark ? colors.title : colors.text,
                                            width: 23,
                                            height: 23,
                                        }
                                    ]}
                                    source={IMAGES.post}
                                />
                                <TextInput
                                    style={[GlobalStyleSheet.input, { color: colors.title }]}
                                    placeholder='Enter your email'
                                    placeholderTextColor={colors.placeholder}
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setFocus({ ...inputFocus, onFocus1: true })}
                                    onBlur={() => setFocus({ ...inputFocus, onFocus1: false })}
                                />
                            </View>

                            <View style={{ marginTop: 10 }}>
                                <Button title="Next" onPress={handleNext} />
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

export default Forgot;