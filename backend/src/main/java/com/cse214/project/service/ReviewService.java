package com.cse214.project.service;

import com.cse214.project.dto.review.ReviewCreateRequest;
import com.cse214.project.dto.review.ReviewDto;
import com.cse214.project.entity.Product;
import com.cse214.project.entity.Review;
import com.cse214.project.entity.User;
import com.cse214.project.repository.ProductRepository;
import com.cse214.project.repository.ReviewRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<ReviewDto> getAllReviews() {
        return reviewRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ReviewDto> getReviewsByProduct(Integer productId) {
        return reviewRepository.findByProductId(productId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ReviewDto> getMyReviews(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        return reviewRepository.findByUserId(user.getId()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ReviewDto createReview(ReviewCreateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Ürün bulunamadı: " + request.getProductId()));

        Review review = Review.builder()
                .user(user)
                .product(product)
                .starRating(request.getStarRating())
                .content(request.getContent())
                .build();

        Review saved = reviewRepository.save(review);
        return toDto(saved);
    }

    public void deleteReview(Integer id, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yorum bulunamadı: " + id));

        // Sadece kendi yorumunu silebilir (veya admin)
        if (!"ADMIN".equals(user.getRoleType()) && !review.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Bu yorumu silme yetkiniz yok.");
        }

        reviewRepository.delete(review);
    }

    private ReviewDto toDto(Review r) {
        return ReviewDto.builder()
                .id(r.getId())
                .productId(r.getProduct().getId())
                .productName(r.getProduct().getName())
                .userName(r.getUser().getName())
                .starRating(r.getStarRating())
                .content(r.getContent())
                .build();
    }
}
