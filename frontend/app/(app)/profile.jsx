import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, User, Mail, School, Calendar, Settings, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react'; // Import useState

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile, isLoading: authLoading } = useAuth(); // Get isLoading from auth
  const [isLoggingOut, setIsLoggingOut] = useState(false); // State to track logout process

  const handleLogout = async () => {
    // Prevent double taps
    if (isLoggingOut) {
      console.log("Logout already in progress, ignoring.");
      return; 
    }

    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => console.log("Logout cancelled by user.")
        },
        { 
          text: "Logout", 
          onPress: async () => { 
            console.log("[handleLogout] Logout confirmed by user. Setting isLoggingOut = true.");
            setIsLoggingOut(true); // Indicate logout started
            try {
              console.log("[handleLogout] Calling logout() from useAuth...");
              
              // Create a timeout promise that will reject after 3 seconds
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Logout timeout")), 3000);
              });
              
              // Race the logout against the timeout
              await Promise.race([
                logout(), // Wait for Firebase signout to complete
                timeoutPromise
              ]);
              
              console.log("[handleLogout] logout() call finished successfully.");
              
              // Let the onAuthStateChanged listener in AuthProvider handle navigation
              // DO NOT navigate directly with router here - that's causing the error
              console.log("[handleLogout] Waiting for auth state to update automatically...");

            } catch (error) {
              console.error("[handleLogout] Error during logout process:", error);
              
              // Despite error, we still want to force logout state in UI
              // This ensures users can still get back to login even if Firebase fails
              console.log("[handleLogout] Forcing navigation to auth screen despite error");
              
              // Wait a moment before attempting navigation to avoid React Navigation issues
              setTimeout(() => {
                try {
                  // Force a navigation to auth screen
                  router.replace({
                    pathname: '/',
                    params: { forceLogout: true }
                  });
                } catch (navError) {
                  console.error("[handleLogout] Navigation error:", navError);
                  Alert.alert("Logout Failed", `An error occurred: ${error.message || 'Please restart the app.'}`);
                }
              }, 100);
            } finally {
              console.log("[handleLogout] Setting isLoggingOut = false.");
              setIsLoggingOut(false); // Reset logout state regardless of outcome
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const pickProfileImage = async () => {
    // Request permissions if needed
    if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      console.log("[pickProfileImage] Image selected:", imageUri);
      // In a real app, you would upload imageUri to Firebase Storage
      // and get a download URL to save in Firestore.
      // For now, just saving the local URI (will only work on the same device session).
      try {
          console.log("[pickProfileImage] Calling updateProfile...");
          await updateProfile({ profileImage: imageUri });
          console.log("[pickProfileImage] updateProfile successful.");
      } catch (error) {
          console.error("[pickProfileImage] Failed to update profile:", error);
          Alert.alert("Update Failed", "Could not update profile image.");
      }
    } else {
        console.log("[pickProfileImage] Image picking cancelled or failed.");
    }
  };

  // Show loading indicator if auth state is loading OR if logging out
  if (authLoading) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5271FF" />
            <Text>Loading Profile...</Text>
        </View>
    );
  }
  
  // Could happen briefly after logout before navigation, or if auth fails initially
  if (!user && !authLoading) {
     console.log("ProfileScreen: No user and not loading, rendering null (should redirect soon).");
     // Or show a message, but usually navigation handles this state
     return (
        <View style={styles.loadingContainer}>
            <Text>Not logged in.</Text> 
        </View>
     );
  }


  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileImageContainer} onPress={pickProfileImage}>
          {user?.profileImage ? ( 
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <User size={40} color="#9CA3AF" />
            </View>
          )}
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>Edit</Text>
          </View>
        </TouchableOpacity>
        
        <Text style={styles.userName}>{user?.name || 'Name not available'}</Text> 
        <Text style={styles.userRole}>{user?.role === 'teacher' ? 'Teacher' : 'Student'}</Text>
      </View>
      
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Mail size={20} color="#5271FF" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'Email not available'}</Text>
          </View>
        </View>
        
         <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <School size={20} color="#5271FF" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>Computer Science</Text> 
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Calendar size={20} color="#5271FF" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}> 
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Join date not available'}
            </Text> 
          </View>
        </View>
      </View>
      
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        {/* Add Account Settings, Preferences items here if needed */}
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.settingItem, styles.logoutButton]}
          onPress={handleLogout} 
          disabled={isLoggingOut} // Disable button while logging out
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconContainer, styles.logoutIcon]}>
              {isLoggingOut ? (
                <ActivityIndicator size="small" color="#EF4444" /> 
              ) : (
                <LogOut size={20} color="#EF4444" />
              )}
            </View>
            <Text style={styles.logoutText}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Smart Attendance v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

// Styles (add loading container)
const styles = StyleSheet.create({
  loadingContainer: { // Added style for loading/empty state
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#5271FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#6B7280',
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  settingsSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF', // Default background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: { // Added for consistency if needed
    fontSize: 16,
    color: '#1A1A1A',
  },
  logoutButton: {
    marginTop: 16,
    borderBottomWidth: 0, // Remove border for logout button
  },
  logoutIcon: {
    backgroundColor: '#FEE2E2', // Specific background for logout icon
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appVersion: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
