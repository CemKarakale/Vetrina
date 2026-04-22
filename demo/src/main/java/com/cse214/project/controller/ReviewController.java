package com.cse214.project.controller;

import com.cse214.project.dto.review.ReviewCreateRequest;
import com.cse214.project.dto.review.ReviewDto;
import com.cse214.project.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('CORPORATE')")
    public ResponseEntity<List<ReviewDto>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByProduct(@PathVariable Integer productId) {
        return ResponseEntity.ok(reviewService.getReviewsByProduct(productId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ReviewDto>> getMyReviews(Authentication auth) {
        return ResponseEntity.ok(reviewService.getMyReviews(auth.getName()));
    }

    @PostMapping
    public ResponseEntity<ReviewDto> createReview(@Valid @RequestBody ReviewCreateRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.createReview(request, auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Integer id, Authentication auth) {
        reviewService.deleteReview(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
