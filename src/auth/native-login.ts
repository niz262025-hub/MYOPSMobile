import { Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
const PENDING_KEY='myops.mobile.pkce.pending.v1';
import { AUTH_ENDPOINTS, MOBILE_CALLBACK } from './config';
import { createChallenge, createState, createVerifier } from './pkce';
import { setMobileTokens } from './mobile-api';

let pending: {state:string;verifier:string;resolve:()=>void;reject:(error:Error)=>void;subscription:{remove:()=>void}}|null=null;
let callbackInProgress=false;

export function cancelMobileLogin() {
 if(!pending) return;
 const current=pending;
 pending=null;
 current.subscription.remove();
 void SecureStore.deleteItemAsync(PENDING_KEY);
 current.reject(new Error('Login cancelled'));
}

export async function startMobileLogin():Promise<void> {
 if(pending) throw new Error('Login already in progress');
 const verifier=createVerifier(),state=createState();
 const challenge=await createChallenge(verifier);
 const url=new URL(AUTH_ENDPOINTS.authorize);
 url.searchParams.set('response_type','code');
 url.searchParams.set('client_id','myopsmobile');
 url.searchParams.set('redirect_uri',MOBILE_CALLBACK);
 url.searchParams.set('code_challenge_method','S256');
 url.searchParams.set('code_challenge',challenge);
 url.searchParams.set('state',state);
 await SecureStore.setItemAsync(PENDING_KEY,JSON.stringify({state,verifier,createdAt:Date.now()}),{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});
 return new Promise<void>((resolve,reject)=>{
  const subscription=Linking.addEventListener('url',({url:callback})=>{void handleMobileCallback(callback)});
  pending={state,verifier,resolve,reject,subscription};
  Linking.openURL(url.toString()).catch(error=>{
   if(pending?.state===state) cancelMobileLogin();
   reject(error instanceof Error?error:new Error('Unable to open login browser'));
  });
 });
}

export async function handleMobileCallback(callback:string):Promise<void> {
 if(callbackInProgress) return;
 let parsed:URL;
 try{parsed=new URL(callback)}catch{return;}
 if(parsed.protocol!=='myops:'||parsed.hostname!=='auth'||parsed.pathname!=='/callback') return;
 callbackInProgress=true;
 try {
 const current=pending;
 if(!current) {
  // Cold-start callback: restore the short-lived PKCE transaction securely.
  const saved=await SecureStore.getItemAsync(PENDING_KEY);
  if(!saved) return;
  try {
   const value=JSON.parse(saved);
   if(typeof value.state!=='string'||typeof value.verifier!=='string'||typeof value.createdAt!=='number'||value.createdAt>Date.now()||Date.now()-value.createdAt>120000){
    await SecureStore.deleteItemAsync(PENDING_KEY);
    return;
   }
   pending={...value,resolve:()=>{},reject:()=>{},subscription:{remove:()=>{}}};
  }catch{return;}
 }
 const active=pending;
 if(!active) return;
 pending=null;
 active.subscription.remove();
 await SecureStore.deleteItemAsync(PENDING_KEY);
 if(parsed.searchParams.get('state')!==active.state){
  active.reject(new Error('Login state mismatch'));
  return;
 }
 const oauthError=parsed.searchParams.get('error');
 if(oauthError){
  active.reject(new Error('MYOPS login was cancelled or rejected'));
  return;
 }
 const code=parsed.searchParams.get('code');
 if(!code||!/^[A-Za-z0-9_-]{32,256}$/.test(code)){
  active.reject(new Error('Missing authorization code'));
  return;
 }
 try {
  const response=await fetch(AUTH_ENDPOINTS.token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   grant_type:'authorization_code',client_id:'myopsmobile',redirect_uri:MOBILE_CALLBACK,code,code_verifier:active.verifier
  })});
  if(!response.ok) throw new Error('Token exchange rejected');
  await setMobileTokens(await response.json());
  active.resolve();
 }catch(error){active.reject(error instanceof Error?error:new Error('Mobile login failed'));}
 } finally { callbackInProgress=false; }
}
