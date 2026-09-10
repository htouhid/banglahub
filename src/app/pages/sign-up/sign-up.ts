import { Component } from '@angular/core';
import { AuthForm } from '../../shared/components/auth-form/auth-form';

@Component({
  selector: 'app-sign-up',
  imports: [AuthForm],
  template: `<section class="auth-page"><h1>Join Bangla Hub</h1><p>Create an account and connect with your community.</p><app-auth-form mode="signUp" /></section>`,
  styleUrl: '../auth-page.scss',
})
export class SignUp {}
