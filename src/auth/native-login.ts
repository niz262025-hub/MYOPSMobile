import { Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
const PENDING_KEY='myops.mobile.pkce.pending.v1';
import { AUTH_ENDPOINTS, MOBILE_CALLBACK, MOBILE_CLIENT_ID } from './config';
import { createChallenge, createState, createVerifier } from './pkce';
import { setMobileTokens } from './mobile-api';

type PendingLogin = {
 state:string;
 nonce:string;
 verifier:string;
 resolve:()=>void;
 reject:(error:Error)=>void;
 subscription:{remove:()=>void};
};

let pending: PendingLogin | null = null;
let callbackInProgress = false;

async function exchangeAuthorizationCode(code: string, verifier: string, state: string) {
 const response = await fetch(AUTH_ENDPOINTS.token, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
   grant_type: 'authorization_code',
   client_id: MOBILE_CLIENT_ID,
   redirect_uri: MOBILE_CALLBACK,
   code,
   code_verifier: verifier,
  }),
 });

 if (!response.ok) {
  const body = await response.text();
  throw new Error(body ? `Token exchange rejected: ${body}` : 'Token exchange rejected');
 }

 const payload = await response.json();
 await setMobileTokens(payload);
}

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
 const verifier=createVerifier();
 const state=createState();
 const nonce=createState();
 const challenge=await createChallenge(verifier);
 await SecureStore.setItemAsync(PENDING_KEY,JSON.stringify({state,nonce,verifier,createdAt:Date.now()}),{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});

 return new Promise<void>((resolve,reject)=>{
  const subscription=Linking.addEventListener('url',({url:callback})=>{void handleMobileCallback(callback)});
  pending={state,nonce,verifier,resolve,reject,subscription};

  fetch(AUTH_ENDPOINTS.authorize,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      client_id: MOBILE_CLIENT_ID,
      redirect_uri: MOBILE_CALLBACK,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    }),
  }).then(async (response)=>{
    if(!response.ok) {
      throw new Error(`Authorization request rejected (${response.status})`);
    }
    const payload = await response.json();
    if (typeof payload?.code !== 'string') {
      throw new Error('Missing authorization code');
    }
    if (payload?.state && payload.state !== state) {
      throw new Error('Login state mismatch');
    }
    await exchangeAuthorizationCode(payload.code, verifier, state);
    if (pending?.state === state) {
      pending.resolve();
      pending = null;
      subscription.remove();
      await SecureStore.deleteItemAsync(PENDING_KEY);
    }
  }).catch((error)=>{
    if (pending?.state === state) {
      pending.reject(error instanceof Error ? error : new Error('Mobile login failed'));
      pending = null;
      subscription.remove();
      void SecureStore.deleteItemAsync(PENDING_KEY);
    }
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
   const saved=await SecureStore.getItemAsync(PENDING_KEY);
   if(!saved) return;
   try {
    const value=JSON.parse(saved);
    if(typeof value.state!=='string'||typeof value.verifier!=='string'||Date.now()-value.createdAt>120000) return;
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
  const code=parsed.searchParams.get('code');
  if(!code||!/^[A-Za-z0-9_-]{32,256}$/.test(code)){
   active.reject(new Error('Missing authorization code'));
   return;
  }
  try {
   await exchangeAuthorizationCode(code, active.verifier, active.state);
   active.resolve();
  }catch(error){active.reject(error instanceof Error?error:new Error('Mobile login failed'));
  }
 } finally { callbackInProgress=false; }
}

