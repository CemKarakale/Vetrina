package com.cse214.project.service;

import com.cse214.project.dto.review.ReviewCreateRequest;
import com.cse214.project.dto.review.ReviewDto;
import com.cse214.project.entity.Product;
import com.cse214.project.entity.Review;
import com.cse214.project.entity.Store;
import com.cse214.project.entity.User;
import com.cse214.project.repository.ProductRepository;
import com.cse214.project.repository.ReviewRepository;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;

    public List<ReviewDto> getAllReviews() {
        return reviewRepository.findAllWithUserAndProduct().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ReviewDto> getReviewsByProduct(Integer productId) {
        return reviewRepository.findByProductIdWithUserAndProduct(productId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ReviewDto> getMyReviews(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        return reviewRepository.findByUserIdWithUserAndProduct(user.getId()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReviewDto createReview(ReviewCreateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        Product product;
        if (request.getProductId() != null && request.getProductId() > 0) {
            product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new RuntimeException("Ürün bulunamadı: " + request.getProductId()));
        } else if (request.getProductName() != null && !request.getProductName().isEmpty()) {
            product = productRepository.findByNameContainingIgnoreCase(request.getProductName())
                    .stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("Ürün bulunamadı: " + request.getProductName()));
        } else {
            throw new RuntimeException("Ürün ID veya adı gerekli");
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .starRating(request.getStarRating())
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .build();

        Review saved = reviewRepository.save(review);
        return toDto(saved);
    }

    @Transactional
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

    @Transactional
    public ReviewDto replyToReview(Integer id, String reply, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yorum bulunamadı: " + id));

        // CORPORATE sadece kendi mağazasının ürünlerine yanıt verebilir
        if ("CORPORATE".equals(user.getRoleType())) {
            Store store = storeRepository.findFirstByOwnerId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Kullanıcının mağazası bulunamadı."));
            if (!review.getProduct().getStore().getId().equals(store.getId())) {
                throw new RuntimeException("Bu yoruma yanıt verme yetkiniz yok.");
            }
        } else if (!"ADMIN".equals(user.getRoleType())) {
            throw new RuntimeException("Bu yoruma yanıt verme yetkiniz yok.");
        }

        review.setAdminReply(reply);
        review.setReplyCreatedAt(LocalDateTime.now());
        Review saved = reviewRepository.save(review);
        return toDto(saved);
    }

    private ReviewDto toDto(Review r) {
        return ReviewDto.builder()
                .id(r.getId())
                .productId(r.getProduct().getId())
                .productName(r.getProduct().getName())
                .userId(r.getUser().getId())
                .userName(r.getUser().getName())
                .starRating(r.getStarRating())
                .content(r.getContent())
                .createdAt(r.getCreatedAt())
                .adminReply(r.getAdminReply())
                .replyCreatedAt(r.getReplyCreatedAt())
                .build();
    }
}
