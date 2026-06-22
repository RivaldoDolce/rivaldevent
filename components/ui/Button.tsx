import { TouchableOpacity, Text } from 'react-native';
export default function Button({ children }: { children: React.ReactNode }){ return (<TouchableOpacity><Text>{children}</Text></TouchableOpacity>); }
