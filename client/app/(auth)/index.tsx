import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSocialAuth } from '@/hooks/useSocialAuth'

const index = () => {
    const { isLoading, handleSocialAuth } = useSocialAuth();
    return (
        <SafeAreaView className='flex-1 items-center gap-6 justify-center'>
            <View>
                <Image className='size-96' source={require('../../assets/images/introBg.png')} />
            </View>
            <View className="flex-col w-full px-8 gap-2">
                <TouchableOpacity className="flex-row items-center justify-center px-6 py-3 bg-white border rounded-full broder-gray-300"
                    onPress={() => { handleSocialAuth("oauth_google") }}
                    disabled={isLoading}
                    style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2
                    }}
                >
                    {
                        isLoading ? (<ActivityIndicator size='small' color="#000" />): (
                            <View className = "flex-row items-center justify-center">
                        <Image
                            source = { require("../../assets/images/google.png") }
                            className = "mr-3 size-10"
                            resizeMode = "contain"
                        />
                    <Text className="text-base font-medium text-black">Continue with Google</Text>
            </View>
            )
                    }
        </TouchableOpacity>

                {/*Apple icon button */ }
    <TouchableOpacity className="flex-row items-center justify-center px-6 py-3 bg-white border rounded-full broder-gray-300"
        onPress={() => { handleSocialAuth("oauth_apple") }}
        disabled={isLoading}
        style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2
        }}
    >
        {
            isLoading ? (
                <ActivityIndicator size='small' color='#000'/>
            ):(
                <View className="flex-row items-center justify-center">
            <Image
                source={require("../../assets/images/apple.png")}
                className="mr-3 size-8"
                resizeMode="contain"
            />
            <Text className="text-base font-medium text-black">Continue with Apple</Text>
        </View>
            )
        }
    </TouchableOpacity>
            </View >
    <Text className="px-2 mt-6 text-xs leading-4 text-center text-gray-500">
        By signing up you agree to our <Text className="text-blue-500">Terms</Text>{", "} <Text className="text-blue-500">Privacy policy</Text>{", and"} <Text className="text-blue-500">Cookies use</Text>
    </Text>
        </SafeAreaView >
    )
}

export default index