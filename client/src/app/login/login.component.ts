import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {Router, RouterLink} from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  styles: [`
    .error-message {
      color: red;
      font-size: 0.8rem;
    }

    .form-field {
      margin-bottom: 15px;
    }

    .brand {
      color: #000000;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  message: string = '';
  submitting = false;
  isError = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.submitting = true;
    this.message = '';
    this.isError = false;

    const formData = this.loginForm.value;
    this.http.post<any>('http://localhost:3000/api/login', formData).subscribe({
      next: (data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        this.message = 'Login successful!';
        this.submitting = false;

        setTimeout(() => {
          window.location.href = '/feed';
          window.location.reload();
        }, 100);
      },
      error: (err) => {
        this.message = err.error.msg || 'Login failed';
        this.isError = true;
        this.submitting = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
