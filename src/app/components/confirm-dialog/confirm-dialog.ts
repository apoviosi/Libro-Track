/*
 * Name: Aquino, Edrel P.
 * Date: November 18, 2026
 * Assignment: CSAPPD1 Final Project - LibroTrack
 */

import { Component, input, output } from '@angular/core';

/**
 * Reusable Catppuccin Mocha confirmation dialog used before destructive
 * actions (currently book deletion). No record is removed until the user
 * explicitly confirms inside this dialog.
 */
@Component({
  selector: 'app-confirm-dialog',
  host: {
    '(document):keydown.escape': 'onEscapePressed()',
  },
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly heading = input('Confirm action');
  readonly message = input('');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected onEscapePressed(): void {
    if (this.open()) {
      this.cancelled.emit();
    }
  }
}
