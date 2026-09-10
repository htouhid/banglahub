import { Injectable } from '@angular/core';
import {
  createClient,
  type AuthResponse,
  type AuthTokenResponsePassword,
  type SupabaseClient,
  type UserResponse,
} from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey,
  );

  signUp(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signUp({ email, password });
  }

  signIn(email: string, password: string): Promise<AuthTokenResponsePassword> {
    return this.client.auth.signInWithPassword({ email, password });
  }

  signOut(): ReturnType<SupabaseClient['auth']['signOut']> {
    return this.client.auth.signOut();
  }

  getSession(): ReturnType<SupabaseClient['auth']['getSession']> {
    return this.client.auth.getSession();
  }

  getUser(): Promise<UserResponse> {
    return this.client.auth.getUser();
  }
}
