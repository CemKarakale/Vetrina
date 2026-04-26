package com.cse214.project.service;

import com.cse214.project.dto.profile.AddressDto;
import com.cse214.project.dto.profile.PreferencesDto;
import com.cse214.project.dto.profile.PreferencesUpdateRequest;
import com.cse214.project.dto.profile.ProfileDto;
import com.cse214.project.dto.profile.ProfileUpdateRequest;
import com.cse214.project.entity.CustomerProfile;
import com.cse214.project.entity.User;
import com.cse214.project.exception.EmailConflictException;
import com.cse214.project.exception.UnauthorizedAccessException;
import com.cse214.project.repository.CustomerProfileRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;

    public ProfileDto getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedAccessException("Kullanıcı bulunamadı."));
        return toProfileDto(user);
    }

    @Transactional
    public ProfileDto updateProfile(String email, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedAccessException("Kullanıcı bulunamadı."));

        if (request.getFirstName() != null) {
            user.setName(request.getFirstName() + (request.getLastName() != null ? " " + request.getLastName() : ""));
        }
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getEmail() != null) {
            if (!request.getEmail().equals(email) && userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new EmailConflictException("Bu email adresi başka bir hesap tarafından kullanılıyor.");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            user.setAddressStreet(request.getAddress().getStreet());
            user.setAddressCity(request.getAddress().getCity());
            user.setAddressState(request.getAddress().getState());
            user.setAddressZipCode(request.getAddress().getZipCode());
            user.setAddressCountry(request.getAddress().getCountry());
        }

        User saved = userRepository.save(user);
        return toProfileDto(saved);
    }

    @Transactional
    public ProfileDto updatePreferences(String email, PreferencesUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedAccessException("Kullanıcı bulunamadı."));

        CustomerProfile profile = customerProfileRepository.findByUser_Id(user.getId())
                .orElseGet(() -> CustomerProfile.builder().user(user).build());

        if (request.getTheme() != null) {
            profile.setMembershipType(request.getTheme());
        }
        if (request.getLanguage() != null) {
            profile.setCity(request.getLanguage());
        }
        if (request.getCurrency() != null) {
            try {
                profile.setAge(Integer.parseInt(request.getCurrency()));
            } catch (NumberFormatException e) {
                profile.setAge(25);
            }
        }

        customerProfileRepository.save(profile);
        return toProfileDto(user);
    }

    private ProfileDto toProfileDto(User user) {
        AddressDto address = null;
        if (user.getAddressStreet() != null || user.getAddressCity() != null) {
            address = AddressDto.builder()
                    .street(user.getAddressStreet())
                    .city(user.getAddressCity())
                    .state(user.getAddressState())
                    .zipCode(user.getAddressZipCode())
                    .country(user.getAddressCountry())
                    .build();
        }

        String[] nameParts = user.getName() != null ? user.getName().split(" ", 2) : new String[]{user.getName(), ""};

        PreferencesDto preferences = PreferencesDto.builder()
                .theme("light")
                .notifications(true)
                .language("English")
                .currency("USD")
                .build();

        try {
            CustomerProfile profile = customerProfileRepository.findByUser_Id(user.getId()).orElse(null);
            if (profile != null) {
                if (profile.getMembershipType() != null) {
                    preferences.setTheme(profile.getMembershipType());
                }
                if (profile.getCity() != null) {
                    preferences.setLanguage(profile.getCity());
                }
                if (profile.getAge() != null) {
                    preferences.setCurrency(String.valueOf(profile.getAge()));
                }
            }
        } catch (Exception e) {
            // Keep defaults
        }

        return ProfileDto.builder()
                .id(user.getId())
                .firstName(nameParts[0])
                .lastName(nameParts.length > 1 ? nameParts[1] : "")
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRoleType())
                .address(address)
                .preferences(preferences)
                .build();
    }
}