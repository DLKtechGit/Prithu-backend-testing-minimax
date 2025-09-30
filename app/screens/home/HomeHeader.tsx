import { View, Text, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { FONTS, IMAGES } from '../../constants/theme'
import { GlobalStyleSheet } from '../../constants/styleSheet'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const HomeHeader = ({ theme }: any) => {

    const { colors } = theme;
    const navigation = useNavigation<any>();

    const [activeAccountType, setActiveAccountType] = useState<string | null>(null);

    useEffect(() => {
        const fetchAccountType = async () => {
            try {
                const storedType = await AsyncStorage.getItem('activeAccountType');
                console.log(storedType)
                if (storedType) {
                    setActiveAccountType(storedType);
                }
            } catch (error) {
                console.log('Error fetching account type:', error);
            }
        };
        fetchAccountType();
    }, []);

    return (
        <View style={[GlobalStyleSheet.flexalingjust, { height: 50 }]}>
            {/* Logo */}
            <View>
                <Image
                    style={{ width: 110, height: 50, resizeMode: 'contain' }}
                    source={theme.dark ? IMAGES.logo3 : IMAGES.logo2}
                />
            </View>

            {/* Right Icons */}
            <View style={{ flexDirection: 'row' }}>

                {/* Show only if Creator */}
                {activeAccountType==="Creator" && (
                    <TouchableOpacity
                        style={[
                            GlobalStyleSheet.btnicon,
                            { marginRight: 10, backgroundColor: theme.dark ? 'rgba(255,255,255,.1)' : '#EFF3FA' }
                        ]}
                        onPress={() => navigation.navigate('AddStory')}
                    >
                        <Image
                            style={{ width: 16, height: 16, tintColor: theme.dark ? '#fff' : '#475A77' }}
                            source={IMAGES.plus}
                        />
                    </TouchableOpacity>
                )}

                {/* Always visible - Notifications */}
                <TouchableOpacity
                    style={[
                        GlobalStyleSheet.btnicon,
                        { marginRight: 10, backgroundColor: theme.dark ? 'rgba(255,255,255,.1)' : '#EFF3FA' }
                    ]}
                    onPress={() => navigation.navigate('notification')}
                >
                    <Image
                        style={{ width: 20, height: 20, tintColor: theme.dark ? '#fff' : '#475A77' }}
                        source={IMAGES.bell}
                    />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default HomeHeader
