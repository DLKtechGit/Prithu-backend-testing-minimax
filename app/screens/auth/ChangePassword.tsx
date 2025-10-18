import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, TextInput, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, IMAGES } from '../../constants/theme';
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import Button from '../../components/button/Button';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ChangePasswordScreenProps = StackScreenProps<RootStackParamList, 'ChangePassword'>;

const ChangePassword = ({ navigation }: ChangePasswordScreenProps) => {
    const theme = useTheme();
    const { colors }: { colors: any } = theme;

    const [show, setShow] = React.useState(true);
    const [show2, setShow2] = React.useState(true);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPopup, setShowPopup] = React.useState(false); // State for popup visibility
    const [popupMessage, setPopupMessage] = React.useState(''); // Popup title
    const [popupSubtitle, setPopupSubtitle] = React.useState(''); // Popup subtitle
    const [inputFocus, setFocus] = React.useState({
        onFocus1: false,
        onFocus2: false,
    });

    const validatePassword = (password: string) => {
        // Regex: At least one special character (@#$%^&*+=!), letter, number, and minimum 8 characters
        const passwordRegex = /^(?=.*[!@#$%^&*+=!])(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    };

    const handleSubmit = async () => {
        // Check for empty fields
        if (!newPassword || !confirmPassword) {
            setPopupMessage('Error!');
            setPopupSubtitle('Please fill all fields');
            setShowPopup(true);
            return;
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            setPopupMessage('Error!');
            setPopupSubtitle('Passwords do not match');
            setShowPopup(true);
            return;
        }

        // Validate password for special character and other requirements
        if (!validatePassword(newPassword)) {
            setPopupMessage('Error!');
            setPopupSubtitle('Password must be at least 8 characters and include at least one special character (e.g., @, #, $, %), one letter, one number');
            setShowPopup(true);
            return;
        }

        try {
            const email = await AsyncStorage.getItem('verifiedEmail');
            console.log('Retrieved email:', email);

            if (!email) {
                setPopupMessage('Error!');
                setPopupSubtitle('Email not found. Please verify again.');
                setShowPopup(true);
                return;
            }

            const response = await fetch('http://192.168.1.42:5000/api/auth/user/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    newPassword,
                }),
            });

            const data = await response.json();
            console.log('Reset password response:', data);

            if (response.ok) {
                await AsyncStorage.removeItem('verifiedEmail');
                setPopupMessage('Success');
                setPopupSubtitle('Password changed successfully!');
                setShowPopup(true);
            } else {
                setPopupMessage('Error!');
                setPopupSubtitle(data.error || 'Failed to change password');
                setShowPopup(true);
            }
        } catch (err: any) {
            console.error('Reset password error:', err);
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
                    source={IMAGES.bugrepellent} // Use same image as Forgot and Otp
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
                            navigation.navigate('Login');
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
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ backgroundColor: COLORS.secondary, flex: 1 }}>
                        <View style={{ alignItems: 'center' }}>
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.00)', 'rgba(255, 255, 255, 0.08)']}
                                style={GlobalStyleSheet.cricleGradient1}
                            />
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.00)', 'rgba(255, 255, 255, 0.08)']}
                                style={GlobalStyleSheet.cricleGradient2}
                            />
                            <View style={{ paddingTop: 40, paddingBottom: 20 }}>
                                <Image style={{ width: 80, height: 80 }} source={IMAGES.logo} />
                            </View>
                            <Text style={GlobalStyleSheet.formtitle}>Change Password</Text>
                            <Text style={GlobalStyleSheet.forndescription}>
                                Please enter your credentials to access your account and detail
                            </Text>
                        </View>
                        <View style={[GlobalStyleSheet.loginarea, { backgroundColor: colors.card }]}>
                            <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>New Password</Text>
                            <View
                                style={[
                                    GlobalStyleSheet.inputBox,
                                    { backgroundColor: colors.input },
                                    inputFocus.onFocus1 && { borderColor: COLORS.primary },
                                ]}
                            >
                                <Image
                                    style={[GlobalStyleSheet.inputimage, { tintColor: theme.dark ? colors.title : colors.text }]}
                                    source={IMAGES.lock}
                                />
                                <TextInput
                                    style={[GlobalStyleSheet.input, { color: colors.title }]}
                                    placeholder="Enter your new password"
                                    placeholderTextColor={colors.placeholder}
                                    secureTextEntry={show}
                                    keyboardType="default"
                                    value={newPassword}
                                    onChangeText={(pass) => setNewPassword(pass)}
                                    onFocus={() => setFocus({ ...inputFocus, onFocus1: true })}
                                    onBlur={() => setFocus({ ...inputFocus, onFocus1: false })}
                                />
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', position: 'absolute', right: 15 }}
                                    onPress={() => setShow(!show)}
                                >
                                    <Image
                                        style={[GlobalStyleSheet.inputSecureIcon, { tintColor: theme.dark ? colors.title : colors.text }]}
                                        source={show ? IMAGES.eyeclose : IMAGES.eyeopen}
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Confirm Password</Text>
                            <View
                                style={[
                                    GlobalStyleSheet.inputBox,
                                    { backgroundColor: colors.input },
                                    inputFocus.onFocus2 && { borderColor: COLORS.primary },
                                ]}
                            >
                                <Image
                                    style={[GlobalStyleSheet.inputimage, { tintColor: theme.dark ? colors.title : colors.text }]}
                                    source={IMAGES.lock}
                                />
                                <TextInput
                                    style={[GlobalStyleSheet.input, { color: colors.title }]}
                                    placeholder="Enter your confirm password"
                                    placeholderTextColor={colors.placeholder}
                                    secureTextEntry={show2}
                                    keyboardType="default"
                                    value={confirmPassword}
                                    onChangeText={(pass) => setConfirmPassword(pass)}
                                    onFocus={() => setFocus({ ...inputFocus, onFocus2: true })}
                                    onBlur={() => setFocus({ ...inputFocus, onFocus2: false })}
                                />
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', position: 'absolute', right: 15 }}
                                    onPress={() => setShow2(!show2)}
                                >
                                    <Image
                                        style={[GlobalStyleSheet.inputSecureIcon, { tintColor: theme.dark ? colors.title : colors.text }]}
                                        source={show2 ? IMAGES.eyeclose : IMAGES.eyeopen}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={{ marginTop: 10 }}>
                                <Button title="Submit" onPress={handleSubmit} />
                            </View>

                            <View style={{ flex: 1 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
                                <Text style={{ ...FONTS.font, color: colors.text }}>Already have an account</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text
                                        style={{
                                            ...FONTS.font,
                                            color: COLORS.primary,
                                            textDecorationLine: 'underline',
                                            textDecorationColor: '#2979F8',
                                            marginLeft: 5,
                                        }}
                                    >
                                        Sign In
                                    </Text>
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

export default ChangePassword;