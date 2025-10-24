import React from 'react';
import { View, Text, Alert, Image, TouchableOpacity, TextInput, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, IMAGES } from '../../constants/theme';
import { useRoute, useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import Button from '../../components/button/Button';
import TermsOfUse from './TermsOfUse';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import { Ionicons } from "@expo/vector-icons";
import { useState , useEffect} from 'react';
import { StyleSheet } from 'react-native';

type RegisterScreenProps = StackScreenProps<RootStackParamList, 'Register'>;

const Register = ({ navigation }: RegisterScreenProps) => {
    const theme = useTheme();
    const { colors }: { colors: any } = theme;

    const [show, setShow] = React.useState(true);
    const [acceptedTerms, setAcceptedTerms] = React.useState(false);
    const [inputFocus, setFocus] = React.useState({
        onFocus1: false,
        onFocus2: false,
        onFocus3: false,
        onFocus4: false,
    });

    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [otp, setOtp] = React.useState('');
    const [otpSent, setOtpSent] = React.useState(false);
    const [otpVerified, setOtpVerified] = React.useState(false);
    const [emailError, setEmailError] = React.useState('');
    const [otpError, setOtpError] = React.useState('');
    const [usernameError, setUsernameError] = React.useState('');
    const [useremailError, setUseremailError] = React.useState('');
    const [passwordError, setPasswordError] = React.useState('');
    const [showPopup, setShowPopup] = useState(false); // State to control popup visibility
    const [popupMessage, setPopupMessage] = useState(''); // Message for the popup
    const [popupSubtitle, setPopupSubtitle] = useState(''); // Subtitle for the popup
    const fadeAnim = useState(new Animated.Value(0))[0]; // Animation value for fade and position

    const route = useRoute<any>();

    // Restore form data and other states when navigating back
    React.useEffect(() => {
        if (route.params) {
            // Update individual state variables from navigation params
            setUsername(route.params.username || '');
            setEmail(route.params.email || '');
            setPassword(route.params.password || '');
            setOtp(route.params.otp || '');
            setOtpSent(route.params.otpSent || false);
            setOtpVerified(route.params.otpVerified || false);
            setAcceptedTerms(route.params.acceptedTerms || false);
        }
    }, [route.params]);

    const checkUsernameAvailability = async (name: string) => {
        if (!name.trim()) {
            setUsernameError('Please enter a username');
            return;
        }

        try {
            console.log('Checking username:', name);
            const res = await fetch(
                `http://192.168.1.10:5000/api/check/username/availability?username=${encodeURIComponent(name)}`,
                { method: 'GET' }
            );

            const data = await res.json();
            console.log('API Response:', data);

            if (res.ok && data.available) {
                setUsernameError('');
            } else {
                setUsernameError(data.message || 'Username is already taken');
            }
        } catch (error) {
            console.error('Error:', error);
            setUsernameError('Error checking username');
        }
    };

    const checkEmailAvailability = async (email: string) => {
        if (!email.trim()) {
            setUseremailError('Please enter an email');
            return;
        }

        try {
            console.log('Checking email:', email);
            const res = await fetch(
                `http://192.168.1.10:5000/api/check/email/availability?email=${encodeURIComponent(email)}`,
                { method: 'GET' }
            );

            const data = await res.json();
            console.log('API Response:', data);

            if (res.ok && data.available) {
                setUseremailError('');
            } else {
                setUseremailError(data.message || 'Email is already taken');
            }
        } catch (error) {
            console.error('Error:', error);
            setUseremailError('Error checking email');
        }
    };

    const validateEmail = (email: string) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email) {
            return 'Please enter your email';
        }
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        return '';
    };

    const validatePassword = (password: string) => {
        const passwordRegex = /^(?=.*[!@#$%^&*+=!])(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
        if (!password) {
            return 'Please enter your password';
        }
        if (!passwordRegex.test(password)) {
            return 'Password must be at least 8 characters and include at least one special character (e.g., @, #, $, %), one letter, and one number';
        }
        return '';
    };

    const handleEmailChange = (text: string) => {
        setEmail(text);
        setEmailError(validateEmail(text));
        checkEmailAvailability(text);
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        setPasswordError(validatePassword(text));
    };

    const sendOtp = async () => {
        if (!email) {
          setPopupMessage('Error');
            setPopupSubtitle('Please enter your email first');
            setShowPopup(true);
            return;
        }
        const domain = email.split('@')[1];
        console.log('Email domain:', domain);

        try {
            const res = await fetch('http://192.168.1.10:5000/api/auth/user/otp-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
              setOtpSent(true);
                setPopupMessage('Success');
                setPopupSubtitle('Successfully the OTP is sent');
                setShowPopup(true);
            } else {
               setPopupMessage('Error');
                setPopupSubtitle(data.message || 'Failed to send OTP');
                setShowPopup(true);
                console.log(data);
            }
        } catch (error) {
            console.error(error);
           setPopupMessage('Error');
            setPopupSubtitle('Failed to connect to server');
            setShowPopup(true);
        }
    };

    const verifyOtp = async () => {
        if (!otp) {
            setPopupMessage('Error');
            setPopupSubtitle('Please enter OTP first');
            setShowPopup(true);
            return;
        }

        try {
            const res = await fetch('http://192.168.1.10:5000/api/auth/new/user/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const data = await res.json();
            console.log(data);

            if (res.ok) {
             setOtpVerified(true);
                setPopupMessage('Success');
                setPopupSubtitle('Your OTP is verified');
                setShowPopup(true);
            } else {
                setOtpVerified(false);
                setPopupMessage('Error');
                setPopupSubtitle(data.message || 'Please verify the OTP');
                setShowPopup(true);
            }
        } catch (error) {
            console.error(error);
           setPopupMessage('Error');
            setPopupSubtitle('Failed to connect to server');
            setShowPopup(true);
        }
    };

    const handleRegister = async () => {
        const incompleteFields = [];
        
        if (!username || usernameError) {
            incompleteFields.push('Username');
        }
        if (!email || emailError || useremailError) {
            incompleteFields.push('Email');
        }
        if (!otp) {
            incompleteFields.push('OTP');
        }
        if (!password || passwordError) {
            incompleteFields.push('Password');
        }
        // if (!acceptedTerms) {
        //     incompleteFields.push('Terms of Use');
        // }

        if (incompleteFields.length > 0) {
          setPopupMessage('Error');
            setPopupSubtitle(`Please complete the ${incompleteFields.join(', ')} field`);
            setShowPopup(true);
            return;
        }
        if (!otpVerified) {
            setPopupMessage('Error');
            setPopupSubtitle('Please verify OTP before registering');
            setShowPopup(true);
            return;
        }

        try {
            const res = await fetch('http://192.168.1.10:5000/api/auth/user/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, otp })
            });

            const data = await res.json();

            if (res.ok) {
                setPopupMessage('Success');
                setPopupSubtitle('Account created successfully');
                setShowPopup(true);
                setTimeout(() => {
                    navigation.navigate('Login');
                }, 2000); // Delay navigation to show success message
            } else {
               setPopupMessage('Error');
                setPopupSubtitle(data.message || 'Something went wrong');
                setShowPopup(true);
                console.log(data);
            }
        } catch (error) {
            console.error(error);
            setPopupMessage('Error');
            setPopupSubtitle('Failed to connect to server');
            setShowPopup(true);
        }
    };

    // Ensure boolean values for input conditions
    const isUsernameComplete = !!username && !usernameError;
    const isEmailComplete = !!email && !emailError && !useremailError && !!otpSent;
    const isOtpComplete = !!otp && !!otpVerified;


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
                    source={IMAGES.bugrepellent} // Replace with your character image
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
        <SafeAreaView style={[GlobalStyleSheet.container, { padding: 0, flex: 1 }]}>
            <KeyboardAvoidingView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ backgroundColor: COLORS.secondary, flex: 1 }}>
                        <View style={{ alignItems: 'center' }}>
                            <LinearGradient colors={['rgba(255, 255, 255, 0.00)', 'rgba(255, 255, 255, 0.08)']} style={GlobalStyleSheet.cricleGradient1} />
                            <LinearGradient colors={['rgba(255, 255, 255, 0.00)', 'rgba(255, 255, 255, 0.08)']} style={GlobalStyleSheet.cricleGradient2} />
                            <View style={{ paddingTop: 40, paddingBottom: 20 }}>
                                <Image style={{ width: 80, height: 80 }} source={IMAGES.logo} />
                            </View>
                            <Text style={GlobalStyleSheet.formtitle}>Create a Account</Text>
                            <Text style={GlobalStyleSheet.forndescription}>Please enter your credentials to access your account and detail</Text>
                        </View>
                        <View style={[GlobalStyleSheet.loginarea, { backgroundColor: colors.card }]}>
                            <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Username</Text>
                            <View
                                style={[
                                    GlobalStyleSheet.inputBox,
                                    { backgroundColor: colors.input },
                                    inputFocus.onFocus1 && { borderColor: COLORS.primary }
                                ]}
                            >
                                <Image
                                    style={[GlobalStyleSheet.inputimage, { tintColor: theme.dark ? colors.title : colors.text }]}
                                    source={IMAGES.usename}
                                />
                                <TextInput
                                    style={[GlobalStyleSheet.input, { color: colors.title }]}
                                    placeholder="Enter your username"
                                    placeholderTextColor={colors.placeholder}
                                    value={username}
                                    onChangeText={(text) => {
                                        setUsername(text);
                                        checkUsernameAvailability(text);
                                    }}
                                    onFocus={() => setFocus({ ...inputFocus, onFocus1: true })}
                                    onBlur={() => setFocus({ ...inputFocus, onFocus1: false })}
                                    editable={true}
                                    showSoftInputOnFocus={true}
                                />
                            </View>
                            {usernameError ? (
                                <Text style={{ ...FONTS.fontSm, color: COLORS.danger, marginTop: -10, marginLeft: 10, marginBottom: 15 }}>
                                    {usernameError}
                                </Text>
                            ) : null}

                            <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Email</Text>
                            <View
                                style={[
                                    GlobalStyleSheet.inputBox,
                                    { backgroundColor: colors.input },
                                    inputFocus.onFocus2 && isUsernameComplete && { borderColor: COLORS.primary },
                                    !isUsernameComplete && { opacity: 0.6 }
                                ]}
                            >
                                <Image
                                    style={[GlobalStyleSheet.inputimage, { tintColor: theme.dark ? colors.title : colors.text }]}
                                    source={IMAGES.email}
                                />
                                <TextInput
                                    style={[GlobalStyleSheet.input, { color: colors.title }]}
                                    placeholder="Enter your email"
                                    placeholderTextColor={colors.placeholder}
                                    value={email}
                                    onChangeText={handleEmailChange}
                                    onFocus={() => isUsernameComplete && setFocus({ ...inputFocus, onFocus2: true })}
                                    onBlur={() => {
                                        setFocus({ ...inputFocus, onFocus2: false });
                                        setEmailError(validateEmail(email));
                                    }}
                                    editable={!otpSent && isUsernameComplete}
                                    showSoftInputOnFocus={!otpSent && isUsernameComplete}
                                    pointerEvents={isUsernameComplete ? 'auto' : 'none'}
                                />
                                {!otpSent && isUsernameComplete && (
                                    <TouchableOpacity
                                        style={[
                                            {
                                                position: 'absolute',
                                                right: 15,
                                                backgroundColor: COLORS.primary,
                                                paddingVertical: 5,
                                                paddingHorizontal: 10,
                                                borderRadius: 5,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            },
                                            (otpVerified || !!useremailError) && {
                                                backgroundColor: '#c6c5c5ff',
                                                opacity: 0.6,
                                            }
                                        ]}
                                        onPress={sendOtp}
                                        disabled={otpVerified || !!useremailError}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                                            Send
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {(emailError || useremailError) ? (
                                <Text style={{ ...FONTS.fontSm, color: COLORS.danger, marginTop: -10, marginLeft: 10, marginBottom: 15 }}>
                                    {useremailError || emailError}
                                </Text>
                            ) : !otpSent ? (
                                <Text style={{ ...FONTS.fontSm, color: colors.text, marginTop: -10, marginLeft: 10, marginBottom: 15 }}>
                                    Please verify your email by sending an OTP
                                </Text>
                            ) : null}

                            {otpSent && (
                                <>
                                    <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Verification OTP</Text>
                                    <View
                                        style={[
                                            GlobalStyleSheet.inputBox,
                                            { backgroundColor: colors.input },
                                            inputFocus.onFocus3 && isEmailComplete && { borderColor: COLORS.primary },
                                            !isEmailComplete && { opacity: 0.6 }
                                        ]}
                                    >
                                        <Image
                                            style={[GlobalStyleSheet.inputimage, { tintColor: theme.dark ? colors.title : colors.text }]}
                                            source={IMAGES.lock}
                                        />
                                        <TextInput
                                            style={[GlobalStyleSheet.input, { color: colors.title }]}
                                            placeholder="Enter verification code"
                                            placeholderTextColor={colors.placeholder}
                                            keyboardType="number-pad"
                                            value={otp}
                                            onChangeText={setOtp}
                                            onFocus={() => isEmailComplete && setFocus({ ...inputFocus, onFocus3: true })}
                                            onBlur={() => setFocus({ ...inputFocus, onFocus3: false })}
                                            editable={!otpVerified}
                                            showSoftInputOnFocus={!otpVerified}
                                            pointerEvents={isEmailComplete ? 'auto' : 'none'}
                                        />
                                        {!otpVerified && (
                                            <TouchableOpacity
                                                style={{
                                                    position: 'absolute',
                                                    right: 15,
                                                    backgroundColor: COLORS.primary,
                                                    paddingVertical: 5,
                                                    paddingHorizontal: 10,
                                                    borderRadius: 5,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                                onPress={verifyOtp}
                                                disabled={!isEmailComplete}
                                            >
                                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                                                    Verify
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    {!otpVerified && (
                                        <Text style={{ ...FONTS.fontSm, color: colors.text, marginTop: -10, marginLeft: 10, marginBottom: 15 }}>
                                            Please enter your OTP to verify
                                        </Text>
                                    )}
                                </>
                            )}

                            <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Password</Text>
                            <View
                                style={[
                                    GlobalStyleSheet.inputBox,
                                    { backgroundColor: colors.input },
                                    inputFocus.onFocus4 && isOtpComplete && { borderColor: COLORS.primary },
                                    !isOtpComplete && { opacity: 0.6 }
                                ]}
                            >
                                <Image
                                    style={[GlobalStyleSheet.inputimage, { tintColor: theme.dark ? colors.title : colors.text }]}
                                    source={IMAGES.lock}
                                />
                                <TextInput
                                    style={[GlobalStyleSheet.input, { color: colors.title }]}
                                    placeholder="Enter your password"
                                    placeholderTextColor={colors.placeholder}
                                    secureTextEntry={show}
                                    keyboardType="default"
                                    value={password}
                                    onChangeText={handlePasswordChange}
                                    onFocus={() => isOtpComplete && setFocus({ ...inputFocus, onFocus4: true })}
                                    onBlur={() => {
                                        setFocus({ ...inputFocus, onFocus4: false });
                                        setPasswordError(validatePassword(password));
                                    }}
                                    editable={!!isOtpComplete}
                                    showSoftInputOnFocus={!!isOtpComplete}
                                    pointerEvents={isOtpComplete ? 'auto' : 'none'}
                                />
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', position: 'absolute', right: 15 }}
                                    onPress={() => setShow(!show)}
                                    disabled={!isOtpComplete}
                                >
                                    <Image
                                        style={[GlobalStyleSheet.inputSecureIcon, { tintColor: theme.dark ? colors.title : colors.text }]}
                                        source={show ? IMAGES.eyeclose : IMAGES.eyeopen}
                                    />
                                </TouchableOpacity>
                            </View>
                            {passwordError ? (
                                <Text style={{ ...FONTS.fontSm, color: COLORS.danger, marginTop: -10, marginLeft: 10, marginBottom: 15 }}>
                                    {passwordError}
                                </Text>
                            ) : null}

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, justifyContent: 'center', marginLeft: 25 }}>
                                <TouchableOpacity
                                    onPress={() => setAcceptedTerms(!acceptedTerms)}
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderWidth: 1.5,
                                        borderColor: COLORS.primary,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 8,
                                        borderRadius: 4,
                                    }}
                                >
                                    {acceptedTerms && (
                                        <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                                <Text style={{ color: colors.text, flex: 1 }}>
                                    I accept and agree to the{' '}
                                    <Text
                                        onPress={() =>
                                            navigation.navigate('TermsOfUse', {
                                                username,
                                                email,
                                                password,
                                                otp,
                                                otpSent,
                                                otpVerified,
                                                acceptedTerms,
                                            })
                                        }
                                        style={{ color: COLORS.primary, textDecorationLine: 'underline' }}
                                    >
                                        Terms of Use
                                    </Text>
                                </Text>
                            </View>

                            <View style={{ marginTop: 10 }}>
                                <Button title="Register" onPress={handleRegister} />
                            </View>

                            <View style={{ flex: 1 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
                                <Text style={{ ...FONTS.font, color: colors.text }}>Already have an account</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={{ ...FONTS.font, color: COLORS.primary, textDecorationLine: 'underline', textDecorationColor: '#2979F8', marginLeft: 5 }}>
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

const styles = StyleSheet.create({
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

export default Register;