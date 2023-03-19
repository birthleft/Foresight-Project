import { Component } from '@angular/core';

@Component({
  selector: 'app-navigation-bar',
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.css']
})
export class NavigationBarComponent {
  onInvite() {
    window.location.href = "https://discord.com/api/oauth2/authorize?client_id=1075089068993544192&permissions=8&scope=bot%20applications.commands";
  }
}
