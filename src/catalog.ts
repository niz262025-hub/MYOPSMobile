export type CatalogApp = {
 name:string;slug:string;description:string;icon:string;url:string|null;
 status:'available'|'coming_soon';
};

export const MYOPS_MASTER = 'https://www.myops.com.my';

export function buildAppUrl(slug: string): string {
  return `${MYOPS_MASTER}/apps/${slug}`;
}

export const catalog:CatalogApp[] = [
 {name:'OpsFinance',slug:'opsfinance',description:'Accounting & finance',icon:'💼',url:buildAppUrl('opsfinance'),status:'available'},
 {name:'OpsFlow',slug:'opsflow',description:'Point of sale & inventory',icon:'🛒',url:buildAppUrl('opsflow'),status:'available'},
 {name:'OpsPS',slug:'opsps',description:'Personal shopper operations',icon:'🛍️',url:null,status:'coming_soon'},
 {name:'OpsHR',slug:'opshr',description:'Human resources',icon:'👥',url:null,status:'coming_soon'},
 {name:'OpsRental',slug:'opsrental',description:'Rental management',icon:'🏠',url:null,status:'coming_soon'},
 {name:'OpsWMS',slug:'opswms',description:'Warehouse management',icon:'📦',url:null,status:'coming_soon'},
 {name:'OpsSmartHome',slug:'opssmarthome',description:'Smart home control',icon:'💡',url:null,status:'coming_soon'},
 {name:'OpsClinic',slug:'opsclinic',description:'Clinic operations',icon:'🩺',url:null,status:'coming_soon'},
 {name:'OpsLife',slug:'opslife',description:'Your personal life manager',icon:'📅',url:null,status:'coming_soon'},
];
// Display status is conservative, independent of server-side subscriptions.
// Never grant access using catalog flags; check role, tenant and entitlements on the server.
