import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth-service';
import { User } from './models/user';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frameworks-final-project');
  private readonly authService = inject(AuthService);

  protected readonly currentUser: User | null = this.authService.currentUser();
  protected readonly sessionTime = signal('00:00:00');
}
