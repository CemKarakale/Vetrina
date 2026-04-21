import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipmentService } from '../../../../core/services/shipment';

@Component({
  selector: 'app-shipments-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shipments-page.html',
  styleUrl: './shipments-page.scss'
})
export class ShipmentsPage implements OnInit {
  shipments = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(private shipmentService: ShipmentService) { }

  isCustomTrackOpen = signal<boolean>(false);
  selectedShipment = signal<any>(null);

  trackCustom() {
    this.isCustomTrackOpen.set(true);
  }

  submitCustomTrack(id: string) {
    if (!id) return;
    // Mocking finding it
    const found = this.shipments().find(s => s.trackingId === id);
    this.isCustomTrackOpen.set(false);
    if (found) {
      this.selectedShipment.set(found);
    } else {
      alert(`Tracking ID ${id} not found in current local database.`);
    }
  }

  trackShipment(shipment: any) {
    this.selectedShipment.set(shipment);
  }

  ngOnInit() {
    this.loadShipments();
  }

  loadShipments() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.shipmentService.getShipments().subscribe({
      next: (data) => {
        this.shipments.set(data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load shipments from API. Showing demo data.');
        this.isLoading.set(false);

        // Mock fallback demo data
        this.shipments.set([
          { trackingId: 'TRK-987123', orderId: 10425, carrier: 'FedEx Express', destination: 'New York, NY', status: 'In Transit', eta: '2025-05-15', updateTime: '2 hours ago' },
          { trackingId: 'TRK-987124', orderId: 10426, carrier: 'UPS Ground', destination: 'Los Angeles, CA', status: 'Delivered', eta: '2025-05-10', updateTime: '1 day ago' },
          { trackingId: 'TRK-987125', orderId: 10427, carrier: 'USPS Priority', destination: 'Chicago, IL', status: 'Out for Delivery', eta: '2025-05-14', updateTime: '30 mins ago' },
          { trackingId: 'TRK-987126', orderId: 10428, carrier: 'DHL Global', destination: 'Miami, FL', status: 'Exception', eta: 'Delayed', updateTime: '5 hours ago' }
        ]);
      }
    });
  }
}
