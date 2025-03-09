import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import {FormGroup, FormBuilder, Validators, ReactiveFormsModule} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [
    ReactiveFormsModule, CommonModule
  ],
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = {};
  loading = false;
  editMode = false;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  imagePreview: string | ArrayBuffer | null | undefined = null;
  selectedFile: File | null = null;
  changePasswordMode = false;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      username: ['', [Validators.required]],
      bio: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.fetchUserProfile();
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  fetchUserProfile(): void {
    this.loading = true;
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
        this.profileForm.patchValue({
          name: user.name || '',
          username: user.username,
          bio: user.bio || ''
        });
      },
      error: (err) => {
        console.error('Error fetching profile:', err);
        this.loading = false;
        this.snackBar.open('Failed to load profile', 'Close', { duration: 3000 });
      }
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      // Reset form when canceling edit
      this.profileForm.patchValue({
        name: this.user.name || '',
        username: this.user.username,
        bio: this.user.bio || ''
      });
    }
  }

  toggleChangePassword(): void {
    this.changePasswordMode = !this.changePasswordMode;
    if (!this.changePasswordMode) {
      this.passwordForm.reset();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {

      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        this.snackBar.open('File is too large. Maximum size is 2MB', 'Close', { duration: 3000 });
        return;
      }

      this.selectedFile = file;

      // Preview image
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadProfileImage(): void {
    if (!this.selectedFile) {
      return;
    }

    this.loading = true;
    const formData = new FormData();
    formData.append('profileImage', this.selectedFile);

    this.userService.updateProfileImage(formData).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
        this.selectedFile = null;
        this.imagePreview = null;
        this.snackBar.open('Profile picture updated successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error uploading profile image:', err);
        this.loading = false;
        this.snackBar.open('Failed to update profile picture', 'Close', { duration: 3000 });
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;
    const updatedProfile = this.profileForm.value;

    this.userService.updateProfile(updatedProfile).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
        this.editMode = false;
        this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.loading = false;
        this.snackBar.open(err.error.message || 'Failed to update profile', 'Close', { duration: 3000 });
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.loading = true;
    const passwords = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.userService.changePassword(passwords).subscribe({
      next: () => {
        this.loading = false;
        this.changePasswordMode = false;
        this.passwordForm.reset();
        this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error changing password:', err);
        this.loading = false;
        this.snackBar.open(err.error.message || 'Failed to change password', 'Close', { duration: 3000 });
      }
    });
  }
}
