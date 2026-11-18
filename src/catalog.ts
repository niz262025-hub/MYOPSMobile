export type CatalogApp = {name:string;slug:string;url:string|null;available:boolean};
export const catalog:CatalogApp[] = [
 {name:'OpsFinance',slug:'opsfinance',url:'https://app.myops.com.my',available:true},
 {name:'OpsFlow',slug:'opsflow',url:'https://opsflow.myops.com.my',available:true},
 {name:'OpsPS',slug:'opsp',url:null,available:false},
 {name:'OpsHR',slug:'opshr',url:null,available:false},
 {name:'OpsRental',slug:'opsrental',url:null,available:false},
 {name:'OpsWMS',slug:'opswms',url:null,available:false},
 {name:'OpsSmartHome',slug:'opssmarthome',url:null,available:false},
 {name:'OpsClinic',slug:'opsclinic',url:null,available:false},
 {name:'OpsLife',slug:'opslife',url:null,available:false},
];
// Availability is conservative until live launch/entitlement APIs are verified.
// Never use client-side catalog status to authorize paid access.
