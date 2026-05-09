export type VisitorStatus = 'INSIDE' | 'CHECKED OUT' | 'DELETED';

export type VisitorType = 
  | 'Donor' 
  | 'Volunteer' 
  | 'Beneficiary' 
  | 'Partner' 
  | 'Vendor' 
  | 'Guest' 
  | 'Staff' 
  | 'Student' 
  | 'Organization'
  | 'Official'
  | 'Maintenance'
  | 'Other';

export type PurposeType = 
  | 'Meeting' 
  | 'Donation' 
  | 'Volunteering' 
  | 'Inquiry' 
  | 'Event' 
  | 'Interview' 
  | 'Student Visit' 
  | 'Service Visit' 
  | 'Delivery' 
  | 'Official Visit' 
  | 'Company Visit' 
  | 'Maintenance Work'
  | 'Other';

export type UserRole = 'ADMIN' | 'STAFF';

export interface Profile {
  phone: string;
  name: string;
  email: string;
  dob: string;
  address: string;
  signature?: string;
  lastVisitId?: string;
  updatedAt: string;
  organizationId: string;
  manualClassification?: 'VIP' | 'VVIP' | 'REGULAR';
}

export interface Visit {
  visitId: string;
  serialNumber?: number;
  visitorPhone: string;
  visitorName: string;
  purpose: PurposeType;
  customPurpose?: string;
  category: string;
  notes?: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: VisitorStatus;
  occasion?: string;
  donationAmount?: number;
  donationStatus?: 'PENDING' | 'COMPLETED';
  organizationId: string;
  createdBy: string;
  recordedBy?: string;
  visitorEmail?: string;
  visitorDOB?: string;
  visitorAddress?: string;
  signature?: string;
  isEmergency?: boolean;
  preRegistrationId?: string;
  deleted?: boolean;
  review?: {
    rating: number;
    comment: string;
    timestamp: string;
  };
}

export type DonationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

export interface DonationAuditEntry {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  userId: string;
  userName: string;
  timestamp: string;
  changes?: Record<string, { from: any; to: any }>;
}

export interface Donation {
  id: string;
  visitorId: string;
  visitorName: string;
  visitorPhone: string;
  amount: number;
  type: string; 
  paymentMode: string;
  receiptMode: 'Physical' | 'Digital' | 'Both';
  donorType: string;
  occasion?: string;
  occasionDate?: string;
  notes?: string;
  date: string;
  timestamp: string;
  organizationId: string;
  recordedBy: string;
  recordedByName: string;
  status: DonationStatus;
  campaign?: string;
  isRecurring: boolean;
  frequency?: 'Monthly' | 'Quarterly' | 'Yearly';
  isInKind: boolean;
  items?: string; // For in-kind donations
  specialLocation?: string;
  auditLog?: DonationAuditEntry[];
  deleted?: boolean;
}

export interface DonationType {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
}

export interface Visitor extends Profile, Visit {
  visitorId: string; // compatibility
  visitCount?: number;
  serialNumber?: number;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  visitorId: string;
  organizationId: string;
  timestamp: string;
  deleted?: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  organizationId: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  createdAt: string;
  lastLogin: string;
  emailVerified?: boolean;
  deleted?: boolean;
  photoURL?: string;
  phone?: string;
  address?: string;
  preferences?: {
    notifs?: boolean;
    public?: boolean;
    density?: boolean;
  };
}

export interface Organization {
  id: string;
  name: string;
  createdBy: string;
  brandColor?: string;
  logoUrl?: string;
  googleReviewUrl?: string;
  setupComplete: boolean;
  createdAt: string;
  migratedToHierarchy?: boolean;
  kioskPin?: string;
  // Dynamic Settings
  navigationVisibility?: Record<string, boolean>;
  visitPurposes?: string[];
  visitorCategories?: string[];
  donationOccasions?: string[];
  eventOccasions?: string[];
  specialLocations?: string[];
  donationTypes?: string[];
  paymentModes?: string[];
  birthdayTrackingEnabled?: boolean;
  autoSyncEnabled?: boolean;
  deactivated?: boolean;
  deactivatedAt?: string;
}

export interface Notification {
  id: string;
  organizationId: string;
  title: string;
  message: string;
  type: 'REVIEW' | 'WAITING' | 'BIRTHDAY' | 'SYSTEM' | 'PRE_REG' | 'DONATION' | 'OCCASION' | 'KIOSK_ASSISTANCE';
  read: boolean;
  timestamp: string;
  relatedId?: string; // visitorId or reviewId
  deleted?: boolean;
}

export interface AppFeedback {
  id: string;
  userId?: string;
  organizationId?: string;
  rating: number;
  uiRating: number;
  speedRating: number;
  featureRating: number;
  frustration?: string;
  missingFeature?: string;
  nps?: number;
  generalComments?: string;
  timestamp: string;
}

export interface BugReport {
  id: string;
  userId?: string;
  organizationId?: string;
  title: string;
  email: string;
  severity: 'ui' | 'minor' | 'major' | 'critical';
  steps: string;
  expected?: string;
  actual?: string;
  attachmentUrl?: string;
  timestamp: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'FIXED' | 'CLOSED';
  deleted?: boolean;
}

export interface PreRegistration {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  email?: string;
  purpose: PurposeType;
  category?: string;
  dob?: string;
  address?: string;
  occasion?: string;
  notes?: string;
  signature?: string;
  visitDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'COMPLETED';
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  deleted?: boolean;
}
