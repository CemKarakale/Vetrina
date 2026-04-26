import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // Holds the current search term typed in the header
  searchTerm = signal<string>('');

  // Updates the search term
  updateSearch(term: string) {
    this.searchTerm.set(term.toLowerCase());
  }

  // Clears the search
  clear() {
    this.searchTerm.set('');
  }
}
