import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../../core/services/review';
import { SearchService } from '../../../../core/services/search';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews-page.html',
  styleUrl: './reviews-page.scss'
})
export class ReviewsPage implements OnInit {
  reviews = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  replyModalId = signal<string | null>(null);

  selectedStars = signal<number | null>(null);
  selectedProduct = signal<string | null>(null);
  selectedUser = signal<string | null>(null);

  // Filtered reviews based on search term and dropdown filters
  filteredReviews = computed(() => {
    const term = this.searchService.searchTerm().toLowerCase();
    const stars = this.selectedStars();
    const product = this.selectedProduct();
    const user = this.selectedUser();
    let list = this.reviews();

    if (term) {
      list = list.filter(r =>
        r.productName?.toLowerCase().includes(term) ||
        r.userName?.toLowerCase().includes(term) ||
        r.content?.toLowerCase().includes(term)
      );
    }

    if (stars !== null) {
      list = list.filter(r => r.starRating === stars);
    }

    if (product) {
      list = list.filter(r => r.productName === product);
    }

    if (user) {
      list = list.filter(r => r.userName === user);
    }

    return list;
  });

  // Unique values for filters
  availableProducts = computed(() => [...new Set(this.reviews().map(r => r.productName))].sort());
  availableUsers = computed(() => [...new Set(this.reviews().map(r => r.userName))].sort());

  newReviewRating = signal<number>(5);
  newReviewContent = signal<string>('');
  newReviewProduct = signal<string>('Select Product');

  constructor(
    private reviewService: ReviewService,
    private searchService: SearchService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const isAdmin = this.canReply(); // Simple check for admin/corporate

    this.reviewService.getReviews(isAdmin).subscribe({
      next: (data) => {
        this.reviews.set(data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load reviews from API. Showing demo data.');
        this.isLoading.set(false);

        // Fallback demo data matching backend DTO fields
        this.reviews.set([
          { id: 1, productId: 1, productName: 'Wireless Noise-Canceling Headphones', userName: 'Alice Johnson', starRating: 5, content: 'Absolutely love these! The noise cancellation is next level and battery life lasts perfectly all week.' },
          { id: 2, productId: 2, productName: 'Ergonomic Office Chair', userName: 'Mark D.', starRating: 4, content: 'Very comfortable for long hours. Only taking a star off because assembly took longer than expected.' },
          { id: 3, productId: 3, productName: 'Smart Fitness Watch', userName: 'Samantha W.', starRating: 2, content: 'Screen scratches easily and step tracker seems wildly inaccurate. Will be returning.' },
          { id: 4, productId: 4, productName: 'Organic Cotton T-Shirt', userName: 'Ethan T.', starRating: 5, content: 'Softest shirt I own, true to size.' },
          { id: 5, productId: 6, productName: 'Ceramic Coffee Mug', userName: 'Jane Smith', starRating: 5, content: 'Gorgeous glaze, perfect morning mug.' }
        ]);
      }
    });
  }

  // Generates array [1,2,3,4,5] for rendering stars
  getStarsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  replyToReview(id: number) {
    this.replyModalId.set(id.toString());
  }

  submitReply(response: string) {
    if (!response) return;
    const targetId = this.replyModalId();
    this.reviews.update(list => list.map(r => r.id.toString() === targetId ? { ...r, adminReply: response } : r));
    this.replyModalId.set(null);
  }

  canReply() {
    let role = (this.authService.getRole() || 'USER').toUpperCase();
    if (role.startsWith('ROLE_')) { role = role.replace('ROLE_', ''); }
    return role === 'ADMIN' || role === 'CORPORATE';
  }

  canDelete(review: any) {
    let role = (this.authService.getRole() || 'USER').toUpperCase();
    if (role.startsWith('ROLE_')) { role = role.replace('ROLE_', ''); }
    const username = this.authService.getUsername() || 'Demo User';
    return role === 'ADMIN' || role === 'CORPORATE' || review.userName === username;
  }

  deleteReview(id: number) {
    this.reviews.update(list => list.filter(r => r.id !== id));
  }

  postReview() {
    if (!this.newReviewContent().trim() || this.newReviewProduct() === 'Select Product') return;
    
    const newId = Math.max(...this.reviews().map(r => r.id), 0) + 1;
    const username = this.authService.getUsername() || 'Demo User';

    const newRev = {
      id: newId,
      productId: 99,
      productName: this.newReviewProduct(),
      userName: username,
      starRating: this.newReviewRating(),
      content: this.newReviewContent(),
      adminReply: null
    };

    this.reviews.update(list => [newRev, ...list]);
    this.newReviewContent.set('');
    this.newReviewRating.set(5);
  }

  clearFilters() {
    this.selectedStars.set(null);
    this.selectedProduct.set(null);
    this.selectedUser.set(null);
  }
}
