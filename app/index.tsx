import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { catalog } from '../src/catalog';
export default function Home() {
  return <View style={styles.root}>
    <Text style={styles.title}>MYOPS Mobile</Text>
    <Text style={styles.subtitle}>One account. Your operations.</Text>
    <Text style={styles.notice}>Central sign-in is being integrated. Modules remain locked until your session and permissions are verified.</Text>
    <FlatList data={catalog} keyExtractor={item => item[0]} numColumns={2} renderItem={({item}) => <View style={styles.card}>
      <Text style={styles.name}>{item[0]}</Text><Text style={styles.lock}>Access pending</Text>
    </View>} />
  </View>;
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#F5F7FC',paddingTop:60,paddingHorizontal:16},title:{fontSize:28,fontWeight:'800',color:'#303F94'},subtitle:{fontSize:16,marginTop:8,color:'#52617C'},notice:{marginVertical:20,color:'#596579'},card:{flex:1,minHeight:120,backgroundColor:'#fff',borderRadius:16,margin:6,padding:16,justifyContent:'space-between'},name:{fontWeight:'700',fontSize:17},lock:{color:'#67748C',fontSize:12}});
