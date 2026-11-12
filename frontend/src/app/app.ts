/*
 * Name: Aquino, Edrel P.
 * Date: November 12, 2026
 * Assignment: CSAPPD1 Final Project - LibroTrack
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  imports: [RouterOutlet, NavbarComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
