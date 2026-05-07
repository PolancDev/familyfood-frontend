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
  familyGroupId: string;
  role: FamilyRole;
  joinedAt: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  userEmail: string;
  familyGroupId: string;
  status: RequestStatus;
  createdAt: string;
}

export type FamilyRole = 'ADMIN' | 'CONSUMER';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
