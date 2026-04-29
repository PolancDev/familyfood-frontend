export type Role = 'INVITADO' | 'ADMIN' | 'CONSUMER';

export interface User {
  id: string;
  email: string;
  nombre: string;
  role: Role;
}
