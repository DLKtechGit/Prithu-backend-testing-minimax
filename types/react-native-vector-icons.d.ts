declare module 'react-native-vector-icons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export class Icon extends Component<IconProps> {}

  export const Ionicons: any;
  export const MaterialIcons: any;
  export const FontAwesome: any;
  export const Foundation: any;
  export const EvilIcons: any;
  export const SimpleLineIcons: any;
  export const Feather: any;
  export const AntDesign: any;
  export const Octicons: any;
  export const MaterialCommunityIcons: any;
  export const Entypo: any;
  export const Zocial: any;
  export const SimpleIcons: any;
}