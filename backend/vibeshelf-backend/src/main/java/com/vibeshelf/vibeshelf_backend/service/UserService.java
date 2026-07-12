// src/main/java/com/vibeshelf/vibeshelf_backend/service/UserService.java
package com.vibeshelf.vibeshelf_backend.service;

import com.vibeshelf.vibeshelf_backend.model.User;
import com.vibeshelf.vibeshelf_backend.repository.UserRepository;
import com.vibeshelf.vibeshelf_backend.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, EmailService emailService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    public void signup(User user) {
        Optional<User> existingUser = userRepository.findByEmail(user.getEmail());

if (existingUser.isPresent()) {

    User existing = existingUser.get();

    // Already verified -> normal error
    if (existing.isVerified()) {
        throw new RuntimeException("Email already registered!");
    }

    // User exists but NOT verified -> resend OTP
    String otp = String.format("%06d", new Random().nextInt(999999));

    existing.setUsername(user.getUsername());
    existing.setPassword(passwordEncoder.encode(user.getPassword()));
    existing.setOtp(otp);
    existing.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

    userRepository.save(existing);

    emailService.sendEmail(
            existing.getEmail(),
            "Your VibeShelf OTP Code",
            "Hello " + existing.getUsername()
                    + ",\n\nYour new OTP is: "
                    + otp
                    + "\n\nIt expires in 5 minutes."
    );

    return;
}

        user.setPassword(passwordEncoder.encode(user.getPassword()));

       String otp = String.format("%06d", new Random().nextInt(999999));

user.setOtp(otp);
user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        
        // For testing purposes, auto-verify users with specific test emails
        if (user.getEmail().equals("test@test.com")) {
            user.setVerified(true);
            user.setOtp(null); // Clear OTP since we're auto-verifying
        } else {
            user.setVerified(false);
        }

        userRepository.save(user);

        String subject = "Your VibeShelf OTP Code";
        String body = "Hello " + user.getUsername() + ",\n\nYour OTP is: " + otp + "\n\nIt will expire in 5 minutes.";
        emailService.sendEmail(user.getEmail(), subject, body);

        System.out.println("✅ OTP sent to email: " + otp);
    }

  public boolean verifyOtp(String email, String otp) {

    Optional<User> userOpt = userRepository.findByEmail(email);

    if (userOpt.isPresent()) {

        User user = userOpt.get();

        // Check OTP exists
        if (user.getOtp() == null) {
            return false;
        }

        // Check OTP expiry
        if (user.getOtpExpiry() != null &&
                user.getOtpExpiry().isBefore(LocalDateTime.now())) {

            user.setOtp(null);
            user.setOtpExpiry(null);
            userRepository.save(user);

            return false;
        }

        // Check OTP matches
        if (user.getOtp().equals(otp)) {

            user.setVerified(true);
            user.setOtp(null);
            user.setOtpExpiry(null);

            userRepository.save(user);

            return true;
        }
    }

    return false;
}

    public ResponseEntity<?> login(User loginRequest) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());
        if (userOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "❌ User not found.");
            response.put("errorCode", "USER_NOT_FOUND");
            return ResponseEntity.badRequest().body(response);
        }

        User user = userOpt.get();

        if (!user.isVerified()) {
            response.put("success", false);
            response.put("message", "❌ Please verify your email before login.");
            response.put("errorCode", "EMAIL_NOT_VERIFIED");
            return ResponseEntity.badRequest().body(response);
        }

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            response.put("success", false);
            response.put("message", "❌ Invalid password.");
            response.put("errorCode", "INVALID_PASSWORD");
            return ResponseEntity.badRequest().body(response);
        }

        // ✅ Successful login - Return token in multiple formats for maximum frontend compatibility
        String userIdString = String.valueOf(user.getId());
        String token = JwtUtil.generateToken(user.getEmail(), userIdString);
        
        // Create response with token in multiple locations for frontend compatibility
        response.put("success", true);
        response.put("message", "✅ Login successful!");
        response.put("token", token);           // Most common expectation
        response.put("accessToken", token);     // Alternative format
        response.put("access_token", token);    // Another common format
        
        // Add user data for e-commerce features
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("username", user.getUsername());
        userData.put("email", user.getEmail());
        userData.put("verified", user.isVerified());
        userData.put("loginTime", LocalDateTime.now().toString());
        
        response.put("user", userData);
        response.put("expiresIn", "24h");
        
        // Also add token to user object (some frontends expect it here)
        userData.put("token", token);

        return ResponseEntity.ok(response);
    }

   // 🔄 Resend OTP
public void resendOtp(String email) {

    Optional<User> userOpt = userRepository.findByEmail(email);

    if (userOpt.isEmpty()) {
        throw new RuntimeException("User not found.");
    }

    User user = userOpt.get();

    if (user.isVerified()) {
        throw new RuntimeException("Email already verified. Please login.");
    }

    String otp = String.format("%06d", new Random().nextInt(999999));

    user.setOtp(otp);
    user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

    userRepository.save(user);

    String subject = "Your VibeShelf OTP Code";
    String body = "Hello " + user.getUsername()
            + ",\n\nYour new OTP is: "
            + otp
            + "\n\nIt expires in 5 minutes.";

    emailService.sendEmail(email, subject, body);

    System.out.println("✅ Resent OTP: " + otp);
}
// 🔄 Send Password Reset OTP
public void sendPasswordResetOtp(String email) {

    Optional<User> userOpt = userRepository.findByEmail(email);

    if (userOpt.isEmpty()) {
        throw new RuntimeException("User not found with this email.");
    }

    User user = userOpt.get();

    String otp = String.format("%06d", new Random().nextInt(999999));

    user.setOtp(otp);
    user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));

    userRepository.save(user);

    String subject = "Password Reset - VibeShelf";

    String body = "Hello " + user.getUsername()
            + ",\n\nYour password reset OTP is: "
            + otp
            + "\n\nThis OTP expires in 10 minutes.";

    emailService.sendEmail(user.getEmail(), subject, body);

    System.out.println("✅ Password reset OTP sent: " + otp);
}

    // 🔄 Reset Password with OTP
public boolean resetPassword(String email, String otp, String newPassword) {

    Optional<User> userOpt = userRepository.findByEmail(email);

    if (userOpt.isPresent()) {

        User user = userOpt.get();

        if (user.getOtp() != null &&
            user.getOtp().equals(otp)) {

            user.setPassword(passwordEncoder.encode(newPassword));
            user.setOtp(null);
            user.setOtpExpiry(null);

            userRepository.save(user);

            return true;
        }
    }

    return false;
}

    // 👤 Get User Profile
    public ResponseEntity<?> getUserProfile(String token) {
        // Remove "Bearer " prefix if present
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        
        try {
            if (!JwtUtil.validateToken(cleanToken)) {
                return ResponseEntity.badRequest().body("Invalid or expired token.");
            }
            
            String email = JwtUtil.extractEmail(cleanToken);
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                Map<String, Object> profile = new HashMap<>();
                profile.put("id", user.getId());
                profile.put("username", user.getUsername());
                profile.put("email", user.getEmail());
                profile.put("verified", user.isVerified());
                
                return ResponseEntity.ok(profile);
            } else {
                return ResponseEntity.badRequest().body("User not found.");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid token.");
        }
    }

    // ✏️ Update User Profile
    public ResponseEntity<?> updateProfile(String token, User updates) {
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        
        try {
            if (!JwtUtil.validateToken(cleanToken)) {
                return ResponseEntity.badRequest().body("Invalid or expired token.");
            }
            
            String email = JwtUtil.extractEmail(cleanToken);
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                
                // Update only allowed fields
                if (updates.getUsername() != null) {
                    user.setUsername(updates.getUsername());
                }
                
                userRepository.save(user);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Profile updated successfully!");
                response.put("user", Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "email", user.getEmail()
                ));
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body("User not found.");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid token.");
        }
    }
    
    // 🔧 Test method to manually verify a user (for development only)
    public String verifyTestUser(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setVerified(true);
            user.setOtp(null);
            userRepository.save(user);
            return "✅ User " + email + " has been manually verified for testing!";
        } else {
            throw new RuntimeException("User not found: " + email);
        }
    }
}