export interface FamilyGroup {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  familyGroupId: string;
  role: FamilyRole;
  joinedAt: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  familyGroupId: string;
  familyGroupName?: string;
  status: RequestStatus;
  createdAt: string;
}

export interface FamilySearchResult {
  id: string;
  name: string;
  memberCount: number;
}

export type FamilyRole = 'ADMIN' | 'CONSUMER';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
