import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth-service';
import { User } from './models/user';
import { Navbar } from './navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frameworks-final-project');
  private readonly authService = inject(AuthService);

  protected get currentUser(): User | null {
    return this.authService.currentUser();
  }
  protected readonly sessionTime = signal('00:00:00');
}
