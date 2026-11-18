import React,{useEffect} from 'react';
import {View,Text} from 'react-native';
import * as Linking from 'expo-linking';
import {router} from 'expo-router';
import {handleMobileCallback} from '../../src/auth/native-login';
export default function AuthCallback(){
 useEffect(()=>{void Linking.getInitialURL().then(url=>{if(url) return handleMobileCallback(url);}).finally(()=>router.replace('/'));},[]);
 return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Completing MYOPS login…</Text></View>;
}
