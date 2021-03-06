import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  menuOpen = true;
  public appPages = [
    { title: 'Home', url: '/home', icon: 'home' },
    { title: 'Practice', url: '/practice', icon: 'accessibility' },
    { title: 'History', url: '/history', icon: 'bar-chart' },
    // { title: 'Account', url: '/account', icon: 'person-circle' },
    // { title: 'Trash', url: '/folder/Trash', icon: 'trash' },
    // { title: 'Spam', url: '/folder/Spam', icon: 'warning' },
  ];
  // public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];
  constructor() {
  }

  closeMenu() {
    console.log('close menu');
    this.menuOpen = false;
  }

  openMenu() {
    this.menuOpen = true;
  }
}
