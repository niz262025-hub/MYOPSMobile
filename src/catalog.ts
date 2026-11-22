export type CatalogApp = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  phase: 1 | 2;
};

// Catalog entries are navigation metadata only; they never authorize access.
export const catalog: CatalogApp[] = [
  { name: 'OpsFinance', slug: 'opsfinance', description: 'Accounting & finance', icon: '💼', phase: 1 },
  { name: 'OpsFlow', slug: 'opsflow', description: 'Retail point of sale', icon: '🛒', phase: 1 },
  { name: 'OpsPS', slug: 'opsps', description: 'Personal shopper operations', icon: '🛍️', phase: 1 },
  { name: 'OpsHR', slug: 'opshr', description: 'Human resources', icon: '👥', phase: 1 },
  { name: 'OpsRental', slug: 'opsrental', description: 'Rental management', icon: '🏠', phase: 1 },
  { name: 'OpsLife', slug: 'opslife', description: 'Personal life manager', icon: '📅', phase: 2 },
  { name: 'OpsWMS', slug: 'opswms', description: 'Warehouse management', icon: '📦', phase: 2 },
  { name: 'OpsClinic', slug: 'opsclinic', description: 'Clinic operations', icon: '🩺', phase: 2 },
  { name: 'OpsHome', slug: 'opshome', description: 'Smart home control', icon: '💡', phase: 2 },
];
