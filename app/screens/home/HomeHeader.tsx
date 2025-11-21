import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlobalStyleSheet } from '../../constants/styleSheet';
import { IMAGES } from '../../constants/theme';

interface HomeHeaderProps {
  theme: any;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ theme }) => {
  const navigation = useNavigation<any>();
  const { colors } = theme;
  const [activeAccountType, setActiveAccountType] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountType = async () => {
      try {
        const storedType = await AsyncStorage.getItem('activeAccountType');
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
    <View style={[GlobalStyleSheet.flexalingjust, { height: 60 }]}>
      {/* Logo */}
      <View>
        <Image
          style={{ 
            width: 180, 
            height: 48, 
            resizeMode: 'contain', 
            marginLeft: -30 
          }}
          source={theme.dark ? IMAGES.logo3 : IMAGES.logo2}
        />
      </View>

      {/* Right Icons */}
      <View style={{ flexDirection: 'row' }}>
        {/* Show only if Creator */}
        {activeAccountType === "Creator" && (
          <TouchableOpacity
            style={[
              GlobalStyleSheet.btnicon,
              { 
                marginRight: 10, 
                backgroundColor: theme.dark ? 'rgba(255,255,255,.1)' : '#EFF3FA' 
              }
            ]}
            onPress={() => navigation.navigate('AddStory')}
          >
            <Image
              style={{ 
                width: 16, 
                height: 16, 
                tintColor: theme.dark ? '#fff' : '#475A77' 
              }}
              source={IMAGES.plus}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default HomeHeader;