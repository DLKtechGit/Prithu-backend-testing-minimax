import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, IMAGES } from '../../constants/theme';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import Button from '../../components/button/Button';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LoginScreenProps = StackScreenProps<RootStackParamList, 'Login'>;

const Login = ({ navigation }: LoginScreenProps) => {

  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  const [show, setshow] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const [inputFocus, setFocus] = React.useState({
    onFocus1: false,
    onFocus2: false
  })
  // ✅ add states for inputs
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const LoginButton = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://192.168.1.77:5000/api/auth/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password })
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (res.ok) {
        // ✅ if backend says success → go to homepage
        // Store token and user data
        await AsyncStorage.setItem('userToken', data.token);
        // await AsyncStorage.setItem('userId', data.user.userId);
        // await AsyncStorage.setItem('userData', JSON.stringify(data.creator));
        // navigation.navigate('DrawerNavigation', {screen : 'Home'});

        // Save userId and accountId
        // await AsyncStorage.setItem('userId', data.user?.id || '');
        // await AsyncStorage.setItem('accountId', data.user?.accountId || '');
     if (data?.userStart === true) {
  navigation.navigate('DrawerNavigation', { screen: 'Home' });
} else {
  navigation.navigate("LanguageScreen");
}
      } else {
        alert(data.message || "Invalid email or password");
        setLoading(false);
        console.log(data)
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong, try again later");
      setLoading(false);
    }
  };

  useFocusEffect(() => {
    setLoading(false);
  })

  return (
    <>
      {loading &&
        <View
          style={{
            backgroundColor: 'rgba(0,0,0,.5)',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            zIndex: 9,
            width: '100%',
            height: '100%',
          }}
        >
          <ActivityIndicator
            size={'large'}
            color={COLORS.white}
          />
        </View>
      }
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
                <Text style={GlobalStyleSheet.formtitle}>Login Account</Text>
                <Text style={GlobalStyleSheet.forndescription}>Please enter your credentials to access your account and detail</Text>
              </View>
              <View style={[GlobalStyleSheet.loginarea, { backgroundColor: colors.card }]}>
                <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Email/Username</Text>
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
                    source={IMAGES.email}
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

                <Text style={[GlobalStyleSheet.inputlable, { color: colors.title }]}>Password</Text>
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
                    source={IMAGES.lock}
                  />

                  <TextInput
                    style={[GlobalStyleSheet.input, { color: colors.title }]}
                    placeholder='Enter your password'
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={show}
                    value={password}
                    onChangeText={setPassword}
                    keyboardType='number-pad'
                    onFocus={() => setFocus({ ...inputFocus, onFocus2: true })}
                    onBlur={() => setFocus({ ...inputFocus, onFocus2: false })}
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
                <View style={{ alignItems: 'flex-end' }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Forgot')}
                  >
                    <Text style={GlobalStyleSheet.btnlink}> Forgot Password? </Text>
                  </TouchableOpacity>
                </View>

                <Button title="Login" onPress={LoginButton} />

                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 40, flex: 1 }}>
                  <View style={{ flex: 1, width: 0, backgroundColor: colors.border, height: 1 }}></View>
                  <View>
                    <Text style={{ ...FONTS.font, paddingHorizontal: 30, color: colors.text }}>or login with</Text>
                  </View>
                  <View style={{ flex: 1, width: 0, backgroundColor: colors.border, height: 1 }}></View>
                </View>

                <TouchableOpacity style={[GlobalStyleSheet.mediabtn, { backgroundColor: theme.dark ? 'rgba(255,255,255,.1)' : '#E8ECF2' }]}>
                  <Image
                    style={{ position: 'absolute', left: 25, width: 20, height: 20 }}
                    source={IMAGES.google}
                  />
                  <Text style={{ ...FONTS.font, fontSize: 15, color: colors.title }}>Login with Google</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 15 }}>
                  <Text style={{ ...FONTS.font, color: colors.text }}>Don't have an account?
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Register')}
                  >
                    <Text style={{ ...FONTS.font, color: COLORS.primary, textDecorationLine: 'underline', textDecorationColor: '#2979F8', marginLeft: 5 }}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default Login;