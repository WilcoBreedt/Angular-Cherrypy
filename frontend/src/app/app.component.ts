import { Component } from '@angular/core';
import { BackendService } from './backend/backend.service';
import { Client } from './models/client.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    clients: Array<Client> = [];

    constructor(private backend: BackendService) {
      this.backend.getClients().then(e => this.clients = e.data.map(x => new Client(x)));
    }

    addClient():void {
      this.clients.push(new Client());
    }

    saveClient(client: Client) {
      client.saveSubscribe().subscribe(e => this.clients = e.data.map(x => new Client(x)));
    }
}
