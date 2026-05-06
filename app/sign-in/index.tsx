import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import SignInForm from '@/components/auth/SignInForm'

export default function SignInPage() {
  return (
    <SafeAreaView className="flex-1">
      <SignInForm/>
    </SafeAreaView>
    
  )
}