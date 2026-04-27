export type Role = 'ADMIN' | 'CONSUMER';

export interface User {
  id: string;
  email: string;
  nombre: string;
  role: Role;
}
