import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('teacher@example.com'); // Pre-filled for demo
  const [password, setPassword] = useState('password'); // Pre-filled for demo
  const [role, setRole] = useState('teacher');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password, role);
      router.replace('/(app)');
    } catch (err) {
      setError('Invalid email or password');
      Alert.alert(
        "Login Failed", 
        "For demo, use:\nTeacher: teacher@example.com\nStudent: student@example.com\nPassword: password",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
          
          <View style={styles.roleSelector}>
            <TouchableOpacity 
              style={[
                styles.roleButton, 
                role === 'student' && styles.activeRoleButton
              ]}
              onPress={() => setRole('student')}
            >
              <Text style={[
                styles.roleText,
                role === 'student' && styles.activeRoleText
              ]}>Student</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.roleButton, 
                role === 'teacher' && styles.activeRoleButton
              ]}
              onPress={() => setRole('teacher')}
            >
              <Text style={[
                styles.roleText,
                role === 'teacher' && styles.activeRoleText
              ]}>Teacher</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.demoNotice}>
            <Text style={styles.demoText}>
              Demo credentials:
            </Text>
            <Text style={styles.demoCredentials}>
              Teacher: teacher@example.com
            </Text>
            <Text style={styles.demoCredentials}>
              Student: student@example.com
            </Text>
            <Text style={styles.demoCredentials}>
              Password: password
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  backButton: {
    padding: 16,
    marginTop: Platform.OS === 'ios' ? 20 : 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeRoleButton: {
    backgroundColor: '#5271FF',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeRoleText: {
    color: '#FFFFFF',
  },
  inputContainer: {
    gap: 16,
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#5271FF',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#5271FF',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  signupText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#5271FF',
    fontSize: 14,
    fontWeight: '500',
  },
  demoNotice: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#F0F4FF',
    borderRadius: 10,
    alignItems: 'center',
  },
  demoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5271FF',
    marginBottom: 8,
  },
  demoCredentials: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});