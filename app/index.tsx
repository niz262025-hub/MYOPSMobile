import React,{useState} from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { catalog } from '../src/catalog';
import { startMobileLogin } from '../src/auth/native-login';
import { getMobileAccessToken, logoutMobileSession } from '../src/auth/mobile-api';
export default function Home() {
 const [status,setStatus]=useState('Sign in to verify your MYOPS session.');
 const [busy,setBusy]=useState(false);
 const signIn=async()=>{setBusy(true);try{await startMobileLogin();const token=await getMobileAccessToken();setStatus(token?'Signed in. App permissions still require server verification.':'Session not available.');}catch(e){setStatus(e instanceof Error?e.message:'Login failed');}finally{setBusy(false);}};
 const signOut=async()=>{setBusy(true);try{await logoutMobileSession();setStatus('Signed out.');}catch{setStatus('Local session cleared; remote logout could not be confirmed.');}finally{setBusy(false);}};
 return <View style={styles.root}>
  <Text style={styles.title}>MYOPS Mobile</Text>
  <Text style={styles.subtitle}>One account. Your operations.</Text>
  <Text style={styles.notice}>{status}</Text>
  <View style={styles.actions}>
   <Pressable disabled={busy} accessibilityRole="button" onPress={signIn} style={styles.button}><Text style={styles.buttonText}>Login with MYOPS</Text></Pressable>
   <Pressable disabled={busy} accessibilityRole="button" onPress={signOut} style={styles.button}><Text style={styles.buttonText}>Logout</Text></Pressable>
  </View>
  <Text style={styles.notice}>Modules remain locked until subscription, role and tenant permissions are verified by the backend.</Text>
  <FlatList data={catalog} keyExtractor={item=>item[0]} numColumns={2} renderItem={({item})=><View style={styles.card}>
   <Text style={styles.name}>{item[0]}</Text><Text style={styles.lock}>Access pending</Text>
  </View>}/>
 </View>;
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#F5F7FC',paddingTop:60,paddingHorizontal:16},title:{fontSize:28,fontWeight:'800',color:'#303F94'},subtitle:{fontSize:16,marginTop:8,color:'#52617C'},notice:{marginVertical:16,color:'#596579'},actions:{flexDirection:'row',gap:8},button:{backgroundColor:'#303F94',padding:12,borderRadius:10,flex:1,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'700'},card:{flex:1,minHeight:120,backgroundColor:'#fff',borderRadius:16,margin:6,padding:16,justifyContent:'space-between'},name:{fontWeight:'700',fontSize:17},lock:{color:'#67748C',fontSize:12}});
