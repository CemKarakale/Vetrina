import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipmentService } from '../../../../core/services/shipment';
import { SearchService } from '../../../../core/services/search';

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
  selectedShipment = signal<any>(null);

  // Filtered shipments based on search term
  filteredShipments = computed(() => {
    const term = this.searchService.searchTerm();
    const list = this.shipments();
    if (!term) return list;
    return list.filter(s =>
      s.id?.toString().includes(term) ||
      s.orderId?.toString().includes(term) ||
      s.mode?.toLowerCase().includes(term) ||
      s.status?.toLowerCase().includes(term)
    );
  });

  constructor(
    private shipmentService: ShipmentService,
    private searchService: SearchService
  ) {}

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

        // Fallback demo data matching backend DTO fields
        this.shipments.set([
          { id: 1, orderId: 10425, warehouse: 'New York Warehouse', mode: 'Express', status: 'In Transit' },
          { id: 2, orderId: 10426, warehouse: 'Los Angeles Warehouse', mode: 'Standard', status: 'Delivered' },
          { id: 3, orderId: 10427, warehouse: 'Chicago Warehouse', mode: 'Priority', status: 'Out for Delivery' },
          { id: 4, orderId: 10428, warehouse: 'Miami Warehouse', mode: 'Economy', status: 'Exception' }
        ]);
      }
    });
  }

  trackShipment(shipment: any) {
    this.selectedShipment.set(shipment);
  }
}
