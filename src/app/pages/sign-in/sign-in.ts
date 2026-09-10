import { Component } from '@angular/core';
import { AuthForm } from '../../shared/components/auth-form/auth-form';

@Component({
  selector: 'app-sign-in',
  imports: [AuthForm],
  template: `<section class="auth-page"><h1>Sign in to Bangla Hub</h1><p>Welcome back to your community.</p><app-auth-form mode="signIn" /></section>`,
  styleUrl: '../auth-page.scss',
})
export class SignIn {}
