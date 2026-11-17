import { InventoryItem, ItemStatus, Customer, Contract, ContractStatus, DeliveryStop, MaintenanceRecord } from '../types';

export const mockItems: InventoryItem[] = [
  { 
    id: '1', name: 'Tallman TS-700 Stringer Block', description: '7-inch High-Velocity distribution stringing block with reinforced gate.', category: 'Distribution', serialNumber: 'TS7-0102', status: ItemStatus.RENTED, rate: 25, location: 'Warehouse A', replacementCost: 550, manufacturer: 'Tallman Specialty', weight: '12 lbs', capacity: '2500 lbs', modelNumber: 'TS-700-HV', dimensions: '14" x 8" x 6"'
  },
  { 
    id: '2', name: 'Tallman TS-1200 Crossarm Block', description: '12-inch heavy duty crossarm mounted stringer block for conductor support.', category: 'Distribution', serialNumber: 'TS12-9920', status: ItemStatus.AVAILABLE, rate: 35, location: 'Warehouse B', replacementCost: 780, manufacturer: 'Tallman Specialty', weight: '18 lbs', capacity: '3500 lbs', modelNumber: 'TS-1200-CA', dimensions: '18" x 10" x 8"'
  },
  { 
    id: '3', name: 'Tallman TS-2000 Transmission Block', description: '20-inch large diameter transmission stringing block for high-tension lines.', category: 'Transmission', serialNumber: 'TS20-4412', status: ItemStatus.MAINTENANCE, rate: 85, location: 'Repair Bay', replacementCost: 1850, manufacturer: 'Tallman Specialty', weight: '45 lbs', capacity: '10000 lbs', modelNumber: 'TS-2000-TX', dimensions: '28" x 22" x 12"'
  },
  { 
    id: '4', name: 'Tallman Double Sheave Stringer Block', description: 'Dual sheave block designed for bundled conductor configurations.', category: 'Transmission', serialNumber: 'TS-DS-8812', status: ItemStatus.AVAILABLE, rate: 125, location: 'Warehouse A', replacementCost: 2800, manufacturer: 'Tallman Specialty', weight: '65 lbs', capacity: '15000 lbs', modelNumber: 'TS-DS-2X', dimensions: '32" x 24" x 14"'
  },
  { 
    id: '5', name: 'Tallman XS-100 Universal Stringer', description: 'Universal lightweight stringing block for varying distribution tasks.', category: 'Universal', serialNumber: 'XS-5512', status: ItemStatus.AVAILABLE, rate: 18, location: 'Warehouse B', replacementCost: 420, manufacturer: 'Tallman Specialty', weight: '8 lbs', capacity: '1500 lbs', modelNumber: 'XS-100-UL', dimensions: '12" x 6" x 4"'
  },
];

export const mockMaintenance: MaintenanceRecord[] = [
  { id: 'm1', itemId: '3', date: '2023-10-01', description: 'Sheave Bearing Replacement', technician: 'Robert J.', cost: 240 },
  { id: 'm2', itemId: '1', date: '2023-08-15', description: 'Gate Hook Inspection', technician: 'Dave L.', cost: 45 }
];

export const mockCustomers: Customer[] = [
  { id: 'C1', name: 'Duke Energy Corporation', email: 'ops@duke-energy.com', phone: '(800) 774-1202', address: '526 S Church St, Charlotte, NC', balance: 4500.00, tags: ['Key Account', 'Utility'] },
  { id: 'C2', name: 'Pacific Gas & Electric (PG&E)', email: 'logistics@pge.com', phone: '(800) 743-5000', address: '77 Beale St, San Francisco, CA', balance: 0.00, tags: ['Utility', 'West Coast'] },
  { id: 'C3', name: 'Southern Company', email: 'procurement@southernco.com', phone: '(404) 506-5000', address: '30 Ivan Allen Jr Blvd NW, Atlanta, GA', balance: 1250.25, tags: ['Utility'] },
  { id: 'C4', name: 'Consolidated Edison (ConEd)', email: 'inventory@coned.com', phone: '(212) 460-4600', address: '4 Irving Pl, New York, NY', balance: 0.00, tags: ['Utility', 'Metropolitan'] },
  { id: 'C5', name: 'National Grid US', email: 'supply.chain@nationalgrid.com', phone: '(781) 907-1000', address: '40 Sylvan Rd, Waltham, MA', balance: 8900.00, tags: ['Utility', 'Industrial'] },
];

export const mockContracts: Contract[] = [
  { 
    id: 'T-1001', customerId: 'C1', customerName: 'Duke Energy Corporation', startDate: '2023-11-20', endDate: '2023-12-20', totalAmount: 750, status: ContractStatus.ACTIVE, items: ['1'],
    isSigned: true, signedAt: '2023-11-19T10:30:00Z', termsAccepted: true, taxRate: 0.08, notes: 'Project North Station Expansion. Site lead: Mark Davis.'
  },
  { 
    id: 'T-1002', customerId: 'C3', customerName: 'Southern Company', startDate: '2023-11-25', endDate: '2023-11-28', totalAmount: 54, status: ContractStatus.RESERVATION, items: ['5'],
    isSigned: false, termsAccepted: true, taxRate: 0.08, notes: 'Standard maintenance reservation.'
  },
  { 
    id: 'T-1003', customerId: 'C2', customerName: 'Pacific Gas & Electric (PG&E)', startDate: '2023-11-15', endDate: '2023-11-18', totalAmount: 375, status: ContractStatus.COMPLETED, items: ['4'],
    isSigned: true, signedAt: '2023-11-14T14:15:00Z', termsAccepted: true, taxRate: 0.08
  },
];

export const mockStops: DeliveryStop[] = [
  { id: 'S1', contractId: 'T-1001', customerName: 'Duke Energy Corporation', address: '526 S Church St, Charlotte, NC', type: 'Delivery', status: 'In Progress', priority: 'High' },
  { id: 'S2', contractId: 'T-1004', customerName: 'Pacific Gas & Electric (PG&E)', address: '77 Beale St, San Francisco, CA', type: 'Pickup', status: 'Pending', priority: 'Medium' },
  { id: 'S3', contractId: 'T-1005', customerName: 'National Grid US', address: '40 Sylvan Rd, Waltham, MA', type: 'Delivery', status: 'Pending', priority: 'Low' },
];