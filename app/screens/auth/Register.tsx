import React from 'react';
import { View, Text,Alert, Image, TouchableOpacity, TextInput, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, IMAGES } from '../../constants/theme';
import { useRoute, useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import Button from '../../components/button/Button';
import TermsOfUse from './TermsOfUse';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import { Ionicons } from "@expo/vector-icons";
// import Checkbox from 'expo-checkbox'; 

type RegisterScreenProps = StackScreenProps<RootStackParamList, 'Register'>;

const Register = ({ navigation } : RegisterScreenProps) => {

    const theme = useTheme();
    const { colors } : {colors : any} = theme;

    const [show, setshow] = React.useState(true);
      // ✅ Terms checkbox state
   const [acceptedTerms, setAcceptedTerms] = React.useState(false);

   const [formData, setFormData] = React.useState({
        username: '',
        email: '',
        password: '',
        otp: '',
    });

   const route = useRoute<any>(); // 🔹 Get route params
 
   // Auto check the box if coming from TermsOfUse
  React.useEffect(() => {
  if (route.params?.formData) {
    setFormData(route.params.formData);
  }
  if (route.params?.otpSent !== undefined) {
    setOtpSent(route.params.otpSent);
  }
  if (route.params?.otpVerified !== undefined) {
    setOtpVerified(route.params.otpVerified);
  }
  if (route.params?.acceptedTerms) {
    setAcceptedTerms(true);
  }
}, [route.params]);
 


    const [inputFocus, setFocus] = React.useState({
        onFocus1: false,
        onFocus2: false,
        onFocus3: false,
        onFocus4: false,
    });

    
    // ✅ Add states for form inputs
    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [otp, setOtp] = React.useState('');
    const [otpSent, setOtpSent] = React.useState(false);
    const [otpVerified, setOtpVerified] = React.useState(false);


     // ✅ Send OTP function
    const sendOtp = async () => {
        if (!email) {
            Alert.alert("Error", "Please enter your email first");
            return;
        }

        try {
            const res = await fetch("http://192.168.1.77:5000/api/auth/user/otp-send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
                setOtpSent(true);
                console.log()
                Alert.alert("Success", "Successfully the OTP is sent");
            } else {
                Alert.alert("Error", data.message || "Failed to send OTP");
                console.log(data)
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to connect to server");
        }
    };
     
    
    // ✅ Verify OTP function
    const verifyOtp = async () => {
    if (!otp) {
        Alert.alert("Error", "Please enter OTP first");
        return;
    }

    try {
        const res = await fetch("http://192.168.1.77:5000/api/auth/new/user/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp })
        });

        const data = await res.json();
          console.log(data)

        if (res.ok) {
            setOtpVerified(true);
            Alert.alert("Success", "Your OTP is verified");
        } else {
            setOtpVerified(false);
            Alert.alert("Error", data.message || "Please verify the OTP");
            // console.log(data);
        }
    } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to connect to server");
       
        
    }
};

    // ✅ Register function
    const handleRegister = async () => {
        if (!username || !email || !password || !otp) {
              Alert.alert("Error", "All fields including OTP are required");
            return;
        }
            if (!otpVerified) {
               Alert.alert("Error", "Please verify OTP before registering");
              return;
             }

          try {
            const res = await fetch("http://192.168.1.77:5000/api/auth/user/register", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, otp })
            });

            const data = await res.json();

            if (res.ok) {
                Alert.alert("Success", "Account created successfully");
                navigation.navigate("Login");
            } else {
                Alert.alert("Error", data.message || "Something went wrong");
                console.log(data)
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to connect to server");
        }
    };

    return (
        <SafeAreaView style={[GlobalStyleSheet.container,{padding:0, flex: 1 }]}>
            <KeyboardAvoidingView
            style={{flex: 1}}
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
                            <Text style={GlobalStyleSheet.formtitle}>Create a Account</Text>
                            <Text style={GlobalStyleSheet.forndescription}>Please enter your credentials to access your account and detail</Text>
                        </View>
                        <View style={[GlobalStyleSheet.loginarea, { backgroundColor: colors.card }]}>
                            <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Username</Text>
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
                                        }
                                    ]}
                                    source={IMAGES.usename}
                                />

                                <TextInput
                                    style={[GlobalStyleSheet.input, { color: colors.title }]}
                                    placeholder='Enter your username'
                                    placeholderTextColor={colors.placeholder}
                                    value={username}
                                    onChangeText={setUsername}
                                    onFocus={() => setFocus({ ...inputFocus, onFocus1: true })}
                                    onBlur={() => setFocus({ ...inputFocus, onFocus1: false })}
                                />
                            </View>

                            <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Email</Text>
                            <View
                                style={[
                                    GlobalStyleSheet.inputBox, {
                                        backgroundColor: colors.input,
                                    },
                                    inputFocus.onFocus2 && {
                                        borderColor: COLORS.primary,
                                    }
                                ]}
                            >
                                <Image
                                    style={[
                                        GlobalStyleSheet.inputimage,
                                        {
                                            tintColor: theme.dark ? colors.title : colors.text,
                                        }
                                    ]}
                                    source={IMAGES.email}
                                />

                                <TextInput
                                    style={[GlobalStyleSheet.input, { color: colors.title }]}
                                    placeholder='Enter your email'
                                    placeholderTextColor={colors.placeholder}
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setFocus({ ...inputFocus, onFocus2: true })}
                                    onBlur={() => setFocus({ ...inputFocus, onFocus2: false })}
                                />

                                {/* ✅ Small tick/check icon inside email box */}
                               <TouchableOpacity
                                style={{ position: "absolute", right: 15 }}
                                  onPress={sendOtp}>
                                 <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                                  </TouchableOpacity>
                                  </View>

                               {/* OTP Input (only visible if otpSent) */}
                                {otpSent && (
                                <>
                                    <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Verification OTP</Text>
                                    <View style={[GlobalStyleSheet.inputBox, { backgroundColor: colors.input }, inputFocus.onFocus4 && { borderColor: COLORS.primary }]}>
                                        <Image style={[GlobalStyleSheet.inputimage, { tintColor: theme.dark ? colors.title : colors.text }]} source={IMAGES.lock} />
                                        <TextInput
                                            style={[GlobalStyleSheet.input, { color: colors.title }]}
                                            placeholder='Enter verification code'
                                            placeholderTextColor={colors.placeholder}
                                            keyboardType='number-pad'
                                            value={otp}
                                            onChangeText={setOtp}
                                            onFocus={() => setFocus({ ...inputFocus, onFocus3: true })}
                                            onBlur={() => setFocus({ ...inputFocus, onFocus3: false })}
                                        />
                                        
                                          {/* ✅ Tick button for OTP verification */}
                                               <TouchableOpacity
                                                 style={{ position: "absolute", right: 15 }}
                                                 onPress={verifyOtp}>
                                                <Ionicons
                                                   name="checkmark-circle"
                                                   size={22}
                                                   color={otpVerified ? "green" : COLORS.primary}
                                                      />
                                                    </TouchableOpacity>
                                                  </View>
                                                  </>
                                                   )}

                            <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Password</Text>
                            <View
                                style={[
                                    GlobalStyleSheet.inputBox, {
                                        backgroundColor: colors.input,
                                    },
                                    inputFocus.onFocus3 && {
                                        borderColor: COLORS.primary,
                                    }
                                ]}
                            >
                                <Image
                                    style={[
                                        GlobalStyleSheet.inputimage,
                                        {
                                            tintColor: theme.dark ? colors.title : colors.text,
                                        }
                                    ]}
                                    source={IMAGES.lock}
                                />

                                <TextInput
                                    style={[GlobalStyleSheet.input, { color: colors.title }]}
                                    placeholder='Enter your password'
                                    placeholderTextColor={colors.placeholder}
                                    secureTextEntry={show}
                                    keyboardType='number-pad'
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setFocus({ ...inputFocus, onFocus4: true })}
                                    onBlur={() => setFocus({ ...inputFocus, onFocus4: false })}
                                />
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        position: 'absolute',
                                        right: 15,

                                    }}
                                    onPress={() => {
                                        setshow(!show)
                                    }}
                                >
                                    <Image
                                        style={[GlobalStyleSheet.inputSecureIcon, {
                                            tintColor: theme.dark ? colors.title : colors.text,
                                        }]}
                                        source={
                                            show
                                                ?
                                                IMAGES.eyeclose
                                                :
                                                IMAGES.eyeopen
                                        }
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* ✅ Terms of Use Checkbox UI */}
                                                         {/*  Terms of Use Checkbox UI */}
                      <View style={{ flexDirection: "row",
                                    alignItems: "center",
                                    marginTop: 15,
                                    justifyContent: "center",
                                    marginLeft : 25
                                   }}>
                           <TouchableOpacity
                           onPress={() => setAcceptedTerms(!acceptedTerms)}
                           style={{
                            width: 20,
                            height: 20,
                            borderWidth: 1.5,
                            borderColor: COLORS.primary,
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 8,
                           borderRadius: 4,
                             }}  >
                         {acceptedTerms && (
                           <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                              )}
                       </TouchableOpacity>
 
                       <Text style={{ color: colors.text, flex: 1 }}>
                                I accept and agree to the{" "}
                    <Text
                          onPress={() =>
                          navigation.navigate("TermsOfUse", {
                          formData,
                          otpSent,
                          otpVerified,
                          acceptedTerms,
                         })
                           }
                        style={{
                         color: COLORS.primary,
                         textDecorationLine: "underline",
                            }}>
                        Terms of Use
                      </Text>
                      </Text>
                     </View>
                        
                            <View style={{ marginTop: 10 }}>
                                <Button title="Register"
                                     onPress={handleRegister}
                                />
                            </View>

                            <View style={{ flex: 1 }}></View>
                            <View style={{ flexDirection: 'row', justifyContent: 'center',marginTop:15 }}>
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
        </SafeAreaView>
    );
};

export default Register;

