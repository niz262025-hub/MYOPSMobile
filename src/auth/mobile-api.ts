import { AUTH_ENDPOINTS } from './config';
import { clearRefreshToken, getRefreshToken, saveRefreshToken } from './session';

type TokenResponse = {access_token:string;refresh_token:string;expires_in:number;token_type:'Bearer'};
let accessToken: string | null = null;
let accessExpiresAt = 0;
let refreshInFlight: Promise<string|null>|null = null;
const post = async (url:string,body:object,authorization?:string) => {
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(authorization?{Authorization:'Bearer '+authorization}:{})},body:JSON.stringify(body)});
 return response;
};
export function setMobileTokens(tokens:TokenResponse) {
 if(typeof tokens?.access_token!=='string'||!tokens.access_token||typeof tokens?.refresh_token!=='string'||!tokens.refresh_token||tokens.token_type!=='Bearer'||!Number.isFinite(tokens.expires_in)||tokens.expires_in<=0) throw new Error('Invalid token response');
 accessToken=tokens.access_token;
 accessExpiresAt=Date.now()+Math.max(0,tokens.expires_in-30)*1000;
 return saveRefreshToken(tokens.refresh_token);
}
async function performRefresh():Promise<string|null> {
 const saved=await getRefreshToken();
 if(!saved) return null;
 try {
  const response=await post(AUTH_ENDPOINTS.refresh,{grant_type:'refresh_token',client_id:'myopsmobile',refresh_token:saved});
  if(!response.ok) {
   if(response.status===400||response.status===401) await clearMobileSession();
   return null;
  }
  const tokens=await response.json() as TokenResponse;
  await setMobileTokens(tokens);
  return accessToken;
 }catch{return null;}
}
export function refreshMobileSession():Promise<string|null> {
 if(!refreshInFlight) {
  const attempt=performRefresh();
  refreshInFlight=attempt;
  void attempt.finally(()=>{if(refreshInFlight===attempt) refreshInFlight=null;});
 }
 return refreshInFlight;
}
export async function getMobileAccessToken():Promise<string|null> {
 if(accessToken&&Date.now()<accessExpiresAt) return accessToken;
 return refreshMobileSession();
}
export async function logoutMobileSession():Promise<void> {
 const saved=await getRefreshToken();
 try {
  if(saved||accessToken) await post(AUTH_ENDPOINTS.revoke,saved?{refresh_token:saved}:{},accessToken||undefined);
 }finally{await clearMobileSession();}
}
export async function clearMobileSession() {
 accessToken=null;
 accessExpiresAt=0;
 await clearRefreshToken();
}
