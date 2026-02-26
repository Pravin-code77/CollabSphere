import React from 'react';
import { StatusBar, StyleSheet, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Compass, Users, User as UserIcon } from 'lucide-react-native';
import { AuthProvider, useAuth } from './src/providers/AuthProvider';

import LoginScreen from './src/features/auth/LoginScreen';
import HomeScreen from './src/features/home/HomeScreen';
import ProfileScreen from './src/features/profile/ProfileScreen';
import ProjectBazaarScreen from './src/features/projects/ProjectBazaarScreen';
import CreateProjectScreen from './src/features/projects/CreateProjectScreen';
import ChatScreen from './src/features/projects/ChatScreen';
import ProjectDetailScreen from './src/features/projects/ProjectDetailScreen';
import TeamsScreen from './src/features/teams/TeamsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICON: Record<string, any> = {
  HomeTab: Home,
  ExploreProject: Compass,
  ExploreTeams: Users,
  ProfileTab: UserIcon,
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }: { color: string; size: number }) => {
        const Icon = TAB_ICON[route.name];
        return Icon ? <Icon size={size} color={color} /> : null;
      },
      tabBarActiveTintColor: '#2563eb',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopColor: '#e2e8f0',
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 8,
        paddingTop: 4,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
      headerStyle: { backgroundColor: 'white' },
      headerShadowVisible: false,
      headerTitleStyle: { fontWeight: '800', color: '#1e293b', fontSize: 18 },
    })}
  >
    <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home', headerShown: false }} />
    <Tab.Screen name="ExploreProject" component={ProjectBazaarScreen} options={{ title: 'Projects' }} />
    <Tab.Screen name="ExploreTeams" component={TeamsScreen} options={{ title: 'Teams' }} />
    <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="CreateProject"
              component={CreateProjectScreen}
              options={{ headerShown: true, title: 'Launch Project', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: true, title: 'Chat', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="ProjectDetail"
              component={ProjectDetailScreen}
              options={{ headerShown: true, title: 'Project Details', headerBackTitle: 'Back' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});

export default App;
