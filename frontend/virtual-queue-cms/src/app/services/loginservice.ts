import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';


@Injectable({ providedIn: 'root' })
export class LoginService {
  private supabase: SupabaseClient;


  constructor() {
    this.supabase = createClient(
      'https://TU_URL_SUPABASE.supabase.co',
      'TU_API_KEY'
    );
  }


  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    return { user: data?.user, error };
  }
}