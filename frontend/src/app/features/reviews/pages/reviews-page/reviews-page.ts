import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../../../core/services/review';

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews-page.html',
  styleUrl: './reviews-page.scss'
})
export class ReviewsPage implements OnInit {
  reviews = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(private reviewService: ReviewService) { }

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.reviewService.getReviews().subscribe({
      next: (data) => {
        this.reviews.set(data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load reviews from API. Showing demo data.');
        this.isLoading.set(false);

        // Mock fallback demo data
        this.reviews.set([
          { id: 'REV-001', productName: 'Wireless Noise-Canceling Headphones', reviewerName: 'Alice Johnson', rating: 5, date: '2025-05-06', text: 'Absolutely love these! The noise cancellation is next level and battery life lasts perfectly all week.', helpfulVotes: 24 },
          { id: 'REV-002', productName: 'Ergonomic Office Chair', reviewerName: 'Mark D.', rating: 4, date: '2025-05-04', text: 'Very comfortable for long hours. Only taking a star off because assembly took longer than expected.', helpfulVotes: 8 },
          { id: 'REV-003', productName: 'Smart Fitness Watch', reviewerName: 'Samantha W.', rating: 2, date: '2025-05-02', text: 'Screen scratches easily and step tracker seems wildly inaccurate. Will be returning.', helpfulVotes: 12 },
          { id: 'REV-004', productName: 'Organic Cotton T-Shirt', reviewerName: 'Ethan T.', rating: 5, date: '2025-04-28', text: 'Softest shirt I own, true to size.', helpfulVotes: 0 },
          { id: 'REV-005', productName: 'Ceramic Coffee Mug', reviewerName: 'Jane Smith', rating: 5, date: '2025-04-20', text: 'Gorgeous glaze, perfect morning mug.', helpfulVotes: 3 }
        ]);
      }
    });
  }

  // Generates array for the stars
  replyModalId = signal<string | null>(null);

  getStarsArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  markHelpful(id: string) {
    this.reviews.update(current => 
      current.map(r => r.id === id ? { ...r, helpfulVotes: (r.helpfulVotes || 0) + 1 } : r)
    );
  }

  replyToReview(id: string) {
    this.replyModalId.set(id);
  }

  submitReply(response: string) {
    if(!response) return;
    this.replyModalId.set(null);
  }
}
