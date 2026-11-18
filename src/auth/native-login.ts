import { Linking } from 'react-native';
import { AUTH_ENDPOINTS, MOBILE_CALLBACK } from './config';
import { createChallenge, createState, createVerifier } from './pkce';
import { setMobileTokens } from './mobile-api';

let pending: {state:string;verifier:string;resolve:()=>void;reject:(error:Error)=>void;subscription:{remove:()=>void}}|null=null;

export function cancelMobileLogin() {
 if(!pending) return;
 const current=pending;
 pending=null;
 current.subscription.remove();
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
 const current=pending;
 if(!current) return;
 let parsed:URL;
 try{parsed=new URL(callback)}catch{return;}
 if(parsed.protocol!=='myops:'||parsed.hostname!=='auth'||parsed.pathname!=='/callback') return;
 pending=null;
 current.subscription.remove();
 if(parsed.searchParams.get('state')!==current.state){
  current.reject(new Error('Login state mismatch'));
  return;
 }
 const code=parsed.searchParams.get('code');
 if(!code||!/^[A-Za-z0-9_-]{32,256}$/.test(code)){
  current.reject(new Error('Missing authorization code'));
  return;
 }
 try {
  const response=await fetch(AUTH_ENDPOINTS.token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   grant_type:'authorization_code',client_id:'myopsmobile',redirect_uri:MOBILE_CALLBACK,code,code_verifier:current.verifier
  })});
  if(!response.ok) throw new Error('Token exchange rejected');
  await setMobileTokens(await response.json());
  current.resolve();
 }catch(error){current.reject(error instanceof Error?error:new Error('Mobile login failed'));}
}
