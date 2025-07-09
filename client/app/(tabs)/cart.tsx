import { View, Text, FlatList, SafeAreaView } from 'react-native'
import React from 'react'
import { useCart } from '@/hooks/useCart'

const cart = () => {
    const {items} = useCart();
  return (
    <SafeAreaView>
        <FlatList 
            data={items}
            renderItem={({item})=><Text>{item.name}</Text>}
            keyExtractor={items=>items.id}
        />
        {
            items.length==0 && <Text>No items in cart</Text>
        }
    </SafeAreaView>
  )
}

export default cart