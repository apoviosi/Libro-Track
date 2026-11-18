/*
 * Name: Aquino, Edrel P.
 * Date: November 12, 2026
 * Assignment: CSAPPD1 Final Project - LibroTrack
 */

import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  protected readonly isOpen = signal(false);

  protected toggle(): void {
    this.isOpen.update((value: boolean) => !value);
  }

  protected close(): void {
    this.isOpen.set(false);
  }
}
